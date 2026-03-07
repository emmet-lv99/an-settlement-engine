/**
 * ============================================
 * executeComparison.ts - 비교 실행 메인 함수
 * ============================================
 *
 * Step 7 비교 기능의 메인 실행 함수입니다.
 * 1. Store에서 필요한 데이터 가져오기
 * 2. 그룹 자동 생성 (유저 그룹 + group-1 파일들 개별 그룹화)
 * 3. 모든 그룹 정규화/병합
 * 4. N-Way 비교 실행
 * 5. 결과 저장
 */

import useDataStore from '../../../store/DataStore'
import { useMappingStore } from '../../../store/MappingStore'
import type { MergedGroup } from '../types/ComparisonTypes'
import { compareNWay } from './comparisonUtils'
import { mergeGroup } from './mergeUtils'
import { normalizeFile } from './normalizationUtils'

/**
 * N-Way 비교 실행
 *
 * 모든 그룹을 자동으로 비교합니다.
 * - 유저가 생성한 그룹: 그룹명 그대로 사용
 * - group-1에 남아있는 파일: 파일명(확장자 제외)으로 개별 그룹 생성
 *
 * @throws Error 필수 데이터가 없을 경우
 */
export async function executeComparison(): Promise<void> {
  // 🔍 전수조사: 추적할 주문번호 목록
  const DEBUG_ORDER_NUMBERS = [
    '20250430-0001104',
    '20250430-0001124',
    '20250430-0001131',
    '20250430-0001145',
    '20250430-0001158',
    '20250430-0001026',
    '20250430-0001069',
    '20250502-0006201',
    '3980191',
  ]

  console.log('\n' + '='.repeat(80))
  console.log('🔍 전수조사 시작: 문제 주문번호 추적')
  console.log('='.repeat(80))
  console.log('추적 대상 주문번호:', DEBUG_ORDER_NUMBERS)
  console.log('='.repeat(80) + '\n')

  try {
    // 1. 로딩 상태 시작
    useDataStore.getState().setIsComparisonLoading(true)

    // 2. Store에서 필요한 데이터 가져오기
    const { parsedData } = useDataStore.getState()
    const {
      fileConfigurations,
      masterKeyColumnName,
      masterQuantityColumnName,
      selectedComparisonTargetColumns,
      step7ComparisonGroups,
    } = useMappingStore.getState()

    // 🔍 [조사 1] 원본 파일에 주문번호가 존재하는지 확인
    console.log('\n🔍 [조사 1] 원본 파일 데이터 확인')
    console.log('-'.repeat(80))
    parsedData.forEach(file => {
      console.log(`\n📄 파일: ${file.name}`)
      console.log(`  총 행 수: ${file.data.length}`)
      
      // 주문번호로 보이는 컬럼 찾기
      const firstRow = file.data[0] || {}
      const possibleOrderColumns = Object.keys(firstRow).filter(key =>
        key.includes('주문') || key.includes('번호') || key.toLowerCase().includes('order')
      )
      console.log(`  주문번호 컬럼 후보: ${possibleOrderColumns.join(', ')}`)
      
      // 각 후보 컬럼에서 추적 대상 주문번호 검색
      possibleOrderColumns.forEach(colName => {
        DEBUG_ORDER_NUMBERS.forEach(debugOrderNum => {
          const found = file.data.find(row => {
            const value = String(row[colName] || '').trim()
            return value === debugOrderNum || value.includes(debugOrderNum)
          })
          if (found) {
            console.log(`  ✅ [${colName}] "${debugOrderNum}" 발견!`)
            console.log(`     → 전체 행 데이터:`, JSON.stringify(found, null, 2))
          }
        })
      })
    })

    // 🔍 [조사 2] Step 3 - 마스터 키 컬럼 확인
    console.log('\n🔍 [조사 2] Step 3 - 마스터 키 컬럼 설정')
    console.log('-'.repeat(80))
    console.log(`  masterKeyColumnName: "${masterKeyColumnName}"`)
    console.log(`  masterQuantityColumnName: "${masterQuantityColumnName}"`)
    console.log(`  selectedComparisonTargetColumns:`, selectedComparisonTargetColumns)

    // 3. 필수 데이터 검증
    if (!masterKeyColumnName) {
      throw new Error('주문번호(키 컬럼)가 설정되지 않았습니다.')
    }

    if (selectedComparisonTargetColumns.length === 0) {
      throw new Error('비교 대상 컬럼이 선택되지 않았습니다.')
    }

    // 상품명 컬럼 찾기
    const productColumnName = selectedComparisonTargetColumns.find(
      col => col.column_name !== masterKeyColumnName,
    )?.column_name

    if (!productColumnName) {
      throw new Error('상품명 컬럼을 찾을 수 없습니다.')
    }

    // 🔍 [조사 3] Step 4 - 파일별 컬럼 매핑 확인
    console.log('\n🔍 [조사 3] Step 4 - 파일별 컬럼 매핑 설정')
    console.log('-'.repeat(80))
    fileConfigurations.forEach((config, fileName) => {
      console.log(`\n📄 파일: ${fileName}`)
      console.log(`  columnMappings:`, config.columnMappings)
      console.log(`  주문번호 매핑: "${masterKeyColumnName}" ← "${config.columnMappings[masterKeyColumnName]}"`)
      console.log(`  valueMappings 개수: ${config.valueMappings.size}`)
      console.log(`  quantityMappings 개수: ${config.quantityMappings.size}`)
    })

    // 4. 그룹 자동 생성
    const allGroups: MergedGroup[] = []

    step7ComparisonGroups.forEach((groupData, groupId) => {
      // 🔧 중복 파일 제거
      const uniqueFiles = [...new Set(groupData.files)]
      if (uniqueFiles.length !== groupData.files.length) {
        console.warn(
          `⚠️ [${groupId}] 중복 파일 제거: ${groupData.files.length}개 → ${uniqueFiles.length}개`,
        )
        groupData.files = uniqueFiles
      }
      // 4-1. "업로드된 파일" 그룹(group-1)의 경우
      if (groupId === 'group-1') {
        groupData.files.forEach(fileName => {
          // 확장자 제거
          const groupName = fileName.replace(/\.[^/.]+$/, '')

          // 파일 1개로 구성된 그룹 생성
          const normalized = normalizeFile(
            fileName,
            parsedData,
            fileConfigurations,
            masterQuantityColumnName,
            productColumnName,
          )

          allGroups.push({
            groupId: `auto-${fileName}`,
            groupTitle: groupName,
            files: [fileName],
            data: normalized,
            rowCount: normalized.length,
          })
        })
      }
      // 4-2. 유저가 생성한 그룹의 경우
      else {
        const merged = mergeGroup(
          groupId,
          groupData.title,
          groupData.files,
          parsedData,
          fileConfigurations,
          masterQuantityColumnName,
          productColumnName,
        )

        allGroups.push(merged)
      }
    })

    // 🔧 [Step 1-2] 그룹 순서 정렬 (키워드 기반)
    // 정렬 우선순위:
    // 1. "공급사" 또는 "정산" 포함 → 첫 번째 (supplierData)
    // 2. "발주" 포함 → 두 번째 (purchaseData)
    // 3. "주문" 포함 → 세 번째 (ordersData)
    // 4. 나머지 → 그 뒤
    const getPriority = (title: string): number => {
      // 한글 유니코드 정규화 (NFC)
      const normalizedTitle = title.normalize('NFC').toLowerCase()

      if (
        normalizedTitle.includes('공급사'.normalize('NFC')) ||
        normalizedTitle.includes('정산'.normalize('NFC'))
      ) {
        return 1 // 최우선
      }
      if (normalizedTitle.includes('발주'.normalize('NFC'))) {
        return 2
      }
      if (normalizedTitle.includes('주문'.normalize('NFC'))) {
        return 3
      }
      return 4 // 기타
    }

    allGroups.sort((a, b) => {
      return getPriority(a.groupTitle) - getPriority(b.groupTitle)
    })

    // 🔍 [조사 4] 그룹 생성 및 정규화 결과 확인
    console.log('\n🔍 [조사 4] 그룹 생성 및 정규화 결과')
    console.log('-'.repeat(80))
    console.log(`총 그룹 수: ${allGroups.length}`)
    allGroups.forEach((group, index) => {
      console.log(`\n[${index}] 그룹명: ${group.groupTitle}`)
      console.log(`  파일: ${group.files.join(', ')}`)
      console.log(`  총 행 수: ${group.rowCount}`)
      
      // 추적 대상 주문번호가 이 그룹에 있는지 확인
      DEBUG_ORDER_NUMBERS.forEach(debugOrderNum => {
        const foundRows = group.data.filter(row => {
          const orderValue = String(row[masterKeyColumnName] || '').trim()
          return orderValue === debugOrderNum || orderValue.includes(debugOrderNum)
        })
        
        if (foundRows.length > 0) {
          console.log(`  ✅ "${debugOrderNum}" 발견! (${foundRows.length}개 행)`)
          foundRows.forEach((row, idx) => {
            console.log(`     [${idx + 1}] 정규화된 데이터:`)
            console.log(`        ${masterKeyColumnName}: "${row[masterKeyColumnName]}"`)
            console.log(`        ${productColumnName}: "${row[productColumnName]}"`)
            if (masterQuantityColumnName) {
              console.log(`        ${masterQuantityColumnName}: "${row[masterQuantityColumnName]}"`)
            }
            console.log(`        전체:`, JSON.stringify(row, null, 2))
          })
        }
      })
    })

    // 🔍 [Step 1-1] 그룹 순서 확인 (정렬 후)
    console.log('\n🔍 [조사 5] 그룹 정렬 순서')
    console.log('-'.repeat(80))
    allGroups.forEach((group, index) => {
      console.log(
        `  [${index}] ${group.groupTitle} (${group.rowCount}행, ${group.files.join(', ')})`,
      )
    })
    console.log(`  → 첫 번째 그룹 "${allGroups[0]?.groupTitle}"이 기준 그룹으로 사용됩니다.\n`)

    // 5. 비교 그룹 검증 (최소 2개 이상)
    if (allGroups.length < 2) {
      throw new Error('비교를 위해서는 최소 2개 이상의 그룹이 필요합니다.')
    }

    // 6. N-Way 비교 실행 (자동으로 모든 그룹 비교)
    const comparisonResult = compareNWay(
      allGroups,
      masterKeyColumnName,
      productColumnName,
      masterQuantityColumnName || '수량',
    )

    // 7. 결과 저장
    useDataStore.getState().setComparisonResult(comparisonResult)
  } catch (error) {
    console.error('❌ 비교 실행 오류:', error)
    throw error
  } finally {
    // 8. 로딩 상태 종료
    useDataStore.getState().setIsComparisonLoading(false)
  }
}
