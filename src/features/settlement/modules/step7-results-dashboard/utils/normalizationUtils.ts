/**
 * ============================================
 * normalizationUtils.ts - 데이터 정규화 유틸
 * ============================================
 *
 * 4~6단계에서 설정한 규칙을 실제 데이터에 적용하여
 * 표준화된 형태로 변환하는 함수들입니다.
 */

import type { NormalizedRow } from '../types/ComparisonTypes'

/**
 * 파일 설정 타입 (MappingStore의 FileConfiguration 참조)
 */
interface FileConfiguration {
  columnMappings: {
    [masterColumn: string]: string | null
  }
  valueMappings: Map<string, Map<string, string>>
  quantityMappings: Map<string, string>
  baseQuantityColumn?: string | null // 4단계: 실제 수량 컬럼
}

/**
 * 4단계: 열 매핑 적용
 *
 * 각 파일의 원본 열 이름을 기준 열 이름으로 변환합니다.
 *
 * @example
 * // columnMappings: { "상품명": "상품명칸", "수량": "갯수" }
 * // 원본: { "상품명칸": "생생효소", "갯수": 2 }
 * // 결과: { "상품명": "생생효소", "수량": 2 }
 *
 * @param row - 원본 행 데이터
 * @param columnMappings - 4단계에서 설정한 열 매핑 규칙
 * @returns 열 이름이 변환된 행 데이터
 */
export function applyColumnMappings(
  row: Record<string, any>,
  columnMappings: FileConfiguration['columnMappings'],
): Record<string, any> {
  const mappedRow: Record<string, any> = {}

  // 각 기준 컬럼에 대해
  for (const [masterColumn, targetColumn] of Object.entries(columnMappings)) {
    // 매핑된 대상 컬럼이 있고, 원본 데이터에 해당 컬럼이 있으면
    if (targetColumn && row[targetColumn] !== undefined) {
      // 기준 컬럼명으로 저장
      mappedRow[masterColumn] = row[targetColumn]
    }
  }

  return mappedRow
}

/**
 * 5단계: 값 매핑 적용
 *
 * 비표준 값을 표준 값으로 변환합니다.
 * Step 5에서 "비교 파일 값 → 기준 파일 값" 형식으로 저장되므로 직접 조회합니다.
 *
 * @example
 * // valueMappings: Map { "상품명" => Map { "옵션=3박스" => "생생효소더그레인" } }
 * // 원본: { "상품명": "옵션=3박스", "수량": 2 }
 * // 결과: { "상품명": "생생효소더그레인", "수량": 2 }
 *
 * @param row - 행 데이터
 * @param valueMappings - 5단계에서 설정한 값 매핑 규칙 (비교 → 기준)
 * @returns 값이 변환된 행 데이터
 */
export function applyValueMappings(
  row: Record<string, any>,
  valueMappings: FileConfiguration['valueMappings'],
): Record<string, any> {
  const result = { ...row }

  // 각 컬럼에 대한 값 매핑 규칙이 있으면
  valueMappings.forEach((valueMap, columnName) => {
    if (result[columnName] !== undefined) {
      const originalValue = String(result[columnName])

      // 직접 조회: 비교 파일 값 → 기준 파일 값
      const mappedValue = valueMap.get(originalValue)

      if (mappedValue) {
        // "__NONE__"은 "값 없음"을 의미하므로 null로 변환
        if (mappedValue === '__NONE__') {
          // ✅ 원본 값을 별도 필드에 저장 (나중에 "비교 파일 값" 표시용)
          result[`__original_${columnName}`] = originalValue
          result[columnName] = null
        } else {
          result[columnName] = mappedValue
        }
      }
    }
  })

  return result
}

/**
 * 5.5단계: 괄호 제거 (상품명 정규화)
 *
 * 상품명에서 괄호와 그 안의 내용을 제거합니다.
 * 예: "생생효소더그레인(270819)_5+2" → "생생효소더그레인_5+2"
 *
 * @param row - 행 데이터
 * @param productColumnName - 상품명 컬럼명 (예: "상품명")
 * @returns 괄호가 제거된 행 데이터
 */
export function removeParentheses(
  row: Record<string, any>,
  productColumnName: string,
): Record<string, any> {
  const result = { ...row }

  if (
    result[productColumnName] !== undefined &&
    result[productColumnName] !== null
  ) {
    const originalValue = String(result[productColumnName])
    // 정규식: '('부터 ')'까지 제거 (여러 개 있어도 모두 제거)
    const cleanedValue = originalValue.replace(/\([^)]*\)/g, '')
    result[productColumnName] = cleanedValue
  }

  return result
}

/**
 * 6단계: 수량 규칙 적용
 *
 * 특정 조건에 맞는 행의 수량을 조정합니다.
 *
 * @example
 * // quantityMappings: Map { "상품옵션=옵션1" => "2" }
 * // masterQuantityColumnName: "주문수량(숫자만)"
 * // baseQuantityColumn: "수량" (Step 4에서 지정)
 * // originalRow: { "상품옵션": "옵션1", "수량": "1" }
 * // normalizedRow: { "상품명": "생생효소", "주문수량(숫자만)": "옵션1" }
 * // 결과: { "상품명": "생생효소", "주문수량(숫자만)": 2 }  // 1 × 2 = 2
 *
 * @param normalizedRow - 정규화된 행 데이터 (열 매핑, 값 매핑 적용 후)
 * @param originalRow - 원본 행 데이터 (매핑 전)
 * @param columnMappings - Step 4에서 설정한 열 매핑 규칙
 * @param quantityMappings - 6단계에서 설정한 수량 규칙
 * @param quantityColumnName - 수량 컬럼명 (3단계에서 선택)
 * @param baseQuantityColumn - 실제 수량 컬럼명 (Step 4에서 지정, 선택사항)
 * @returns 수량이 조정된 행 데이터
 */
export function applyQuantityRules(
  normalizedRow: Record<string, any>,
  originalRow: Record<string, any>,
  columnMappings: FileConfiguration['columnMappings'],
  quantityMappings: FileConfiguration['quantityMappings'],
  quantityColumnName: string | null,
  baseQuantityColumn?: string | null,
): Record<string, any> {
  if (!quantityColumnName) {
    return normalizedRow
  }

  const result = { ...normalizedRow }
  let quantityRuleApplied = false

  // 각 컬럼의 값에 대응하는 수량 규칙 찾기 (정규화된 row 기준)
  for (const [columnName, value] of Object.entries(normalizedRow)) {
    // "컬럼명=값" 형식의 키로 수량 규칙 검색
    const key = `${columnName}=${value}`
    const quantityRule = quantityMappings.get(key)

    if (quantityRule) {
      // 1순위: baseQuantityColumn (Step 4에서 지정한 실제 수량 컬럼)
      let baseQuantity: number
      if (baseQuantityColumn && originalRow[baseQuantityColumn] !== undefined) {
        baseQuantity = Number(originalRow[baseQuantityColumn])
      }
      // 2순위: columnMappings을 통한 원본 수량 컬럼
      else {
        const quantitySourceColumn = columnMappings[quantityColumnName]
        baseQuantity = quantitySourceColumn
          ? Number(originalRow[quantitySourceColumn])
          : Number(result[quantityColumnName])
      }

      if (!isNaN(baseQuantity) && baseQuantity > 0) {
        // 원본 수량에 규칙 곱하기
        const multiplier = Number(quantityRule) || 1
        result[quantityColumnName] = baseQuantity * multiplier
      } else {
        // 원본 수량이 없으면 규칙 값으로 대체
        result[quantityColumnName] = Number(quantityRule) || 1
      }

      quantityRuleApplied = true
      break // 첫 번째 매칭된 규칙만 적용
    }
  }

  // 규칙이 적용되지 않았고, 수량 컬럼이 텍스트인 경우
  if (!quantityRuleApplied) {
    const currentValue = result[quantityColumnName]
    if (isNaN(Number(currentValue))) {
      // 1순위: baseQuantityColumn 사용
      let baseQuantity: number
      if (baseQuantityColumn && originalRow[baseQuantityColumn] !== undefined) {
        baseQuantity = Number(originalRow[baseQuantityColumn])
      }
      // 2순위: columnMappings 사용
      else {
        const quantitySourceColumn = columnMappings[quantityColumnName]
        baseQuantity = quantitySourceColumn
          ? Number(originalRow[quantitySourceColumn])
          : NaN
      }

      result[quantityColumnName] =
        !isNaN(baseQuantity) && baseQuantity > 0 ? baseQuantity : 1
    }
  }

  return result
}

/**
 * 통합: 한 파일의 모든 행을 정규화
 *
 * 4, 5, 6단계 규칙을 순차적으로 적용하여
 * 원본 데이터를 표준화된 형태로 변환합니다.
 *
 * @param fileName - 정규화할 파일명
 * @param parsedData - DataStore의 parsedData (모든 파일의 원본 데이터)
 * @param fileConfigurations - MappingStore의 fileConfigurations (모든 규칙)
 * @param masterQuantityColumnName - 3단계에서 선택한 수량 컬럼명
 * @param masterProductColumnName - 3단계에서 선택한 상품명 컬럼명
 * @returns 정규화된 행 배열
 */
export function normalizeFile(
  fileName: string,
  parsedData: any[],
  fileConfigurations: Map<string, FileConfiguration>,
  masterQuantityColumnName: string | null,
  masterProductColumnName: string | null,
): NormalizedRow[] {
  // 해당 파일의 원본 데이터 찾기
  const fileData = parsedData.find(d => d.name === fileName)
  const config = fileConfigurations.get(fileName)

  if (!fileData || !config) {
    console.warn(`⚠️ 파일 정규화 실패: ${fileName}`)
    return []
  }

  // 각 행에 대해 정규화 수행
  const normalizedData = fileData.data.map((row: Record<string, any>) => {
    // 4단계: 열 매핑 적용
    let normalized = applyColumnMappings(row, config.columnMappings)

    // 5단계: 값 매핑 적용
    normalized = applyValueMappings(normalized, config.valueMappings)

    // 5.5단계: 괄호 제거 (상품명 정규화)
    if (masterProductColumnName) {
      normalized = removeParentheses(normalized, masterProductColumnName)
    }

    // 6단계: 수량 규칙 적용 (원본 row, columnMappings, baseQuantityColumn 전달)
    normalized = applyQuantityRules(
      normalized,
      row, // 원본 행 데이터 전달
      config.columnMappings,
      config.quantityMappings,
      masterQuantityColumnName,
      config.baseQuantityColumn, // Step 4에서 지정한 실제 수량 컬럼
    )

    return normalized as NormalizedRow
  })

  return normalizedData
}
