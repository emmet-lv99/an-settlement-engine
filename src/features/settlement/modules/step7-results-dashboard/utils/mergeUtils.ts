/**
 * ============================================
 * mergeUtils.ts - 파일 병합 유틸
 * ============================================
 *
 * 여러 파일을 하나의 그룹으로 병합하는 함수들입니다.
 * ADVANCED 모드에서 사용됩니다.
 */

import type { MergedGroup, NormalizedRow } from '../types/ComparisonTypes'
import { normalizeFile } from './normalizationUtils'

/**
 * 그룹 내 파일들을 병합
 *
 * 그룹에 속한 모든 파일을 정규화하고,
 * 하나의 큰 데이터셋으로 합칩니다.
 *
 * @example
 * // 입력
 * // - groupId: "group-1"
 * // - fileNames: ["file1.xlsx", "file2.xlsx"]
 * // - file1: 100행, file2: 50행
 * //
 * // 출력
 * // - MergedGroup { data: 150행 (file1 + file2) }
 *
 * @param groupId - 그룹 ID (예: "group-1")
 * @param groupTitle - 그룹 제목 (예: "업로드된 파일")
 * @param fileNames - 그룹에 포함된 파일명 배열
 * @param parsedData - DataStore의 parsedData
 * @param fileConfigurations - MappingStore의 fileConfigurations
 * @param masterQuantityColumnName - 3단계에서 선택한 수량 컬럼명
 * @param masterProductColumnName - 3단계에서 선택한 상품명 컬럼명
 * @returns 병합된 그룹 데이터
 */
export function mergeGroup(
  groupId: string,
  groupTitle: string,
  fileNames: string[],
  parsedData: any[],
  fileConfigurations: Map<string, any>,
  masterQuantityColumnName: string | null,
  masterProductColumnName: string | null,
): MergedGroup {
  // console.log(`🔀 그룹 병합 시작: ${groupTitle} (${fileNames.length}개 파일)`)

  const allData: NormalizedRow[] = []

  // 그룹 내 모든 파일을 정규화하고 합치기
  for (const fileName of fileNames) {
    const normalized = normalizeFile(
      fileName,
      parsedData,
      fileConfigurations,
      masterQuantityColumnName,
      masterProductColumnName,
    )
    allData.push(...normalized)
  }

  // console.log(`✅ 그룹 병합 완료: ${groupTitle} (총 ${allData.length}행)`)

  // 🔍 특정 주문번호 병합 후 확인
  // const debugMergedRow = allData.find(
  //   row => row['주문번호'] === '20250604-0001004',
  // )
  // if (debugMergedRow) {
  //   console.log('🔍 [병합 후] 20250604-0001004 발견!')
  //   console.log('  병합된 데이터:', debugMergedRow)
  // } else {
  //   console.log('⚠️ [병합 후] 20250604-0001004 없음!')
  // }

  return {
    groupId,
    groupTitle,
    files: fileNames,
    data: allData,
    rowCount: allData.length,
  }
}

/**
 * 여러 그룹을 병합 (필요시 사용)
 *
 * 여러 그룹의 데이터를 하나로 합칩니다.
 * 현재는 사용하지 않지만, 향후 확장을 위해 준비
 *
 * @param groups - 병합할 그룹 배열
 * @returns 병합된 단일 그룹
 */
export function mergeMultipleGroups(groups: MergedGroup[]): MergedGroup {
  const allData: NormalizedRow[] = []
  const allFiles: string[] = []

  groups.forEach(group => {
    allData.push(...group.data)
    allFiles.push(...group.files)
  })

  return {
    groupId: 'merged',
    groupTitle: '병합된 그룹',
    files: allFiles,
    data: allData,
    rowCount: allData.length,
  }
}
