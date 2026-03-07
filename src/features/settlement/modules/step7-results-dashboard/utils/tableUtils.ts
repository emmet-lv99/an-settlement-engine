/**
 * ============================================
 * tableUtils.ts - 비교 결과 → 테이블 변환
 * ============================================
 *
 * N-Way 비교 결과를 엑셀/UI 출력용 테이블 형태로 변환합니다.
 * 동적 컬럼을 지원하여 N개 그룹을 표시할 수 있습니다.
 */

import type {
  ItemDetailRow,
  MismatchDetailRow,
  NWayComparisonResult,
  OrderSummaryRow,
  StatisticsRow,
} from '../types/ComparisonTypes'

/**
 * 상품명을 UI 표시용으로 포맷팅
 * null 또는 'null'인 경우 "값 없음 (매핑 제외)"로 표시
 */
function formatProductName(productName: string | null): string {
  if (productName === null || productName === 'null') {
    return '값 없음 (매핑 제외)'
  }
  return productName
}

/**
 * 주문 요약 테이블 생성 (N-Way)
 *
 * 전체 주문의 일치/불일치 현황을 요약합니다.
 *
 * @param result - N-Way 비교 결과
 * @returns 주문 요약 테이블 행 배열
 */
export function generateOrderSummaryTable(
  result: NWayComparisonResult,
): OrderSummaryRow[] {
  return result.orderResults.map(order => {
    const { orderNumber, summary, existsInGroups, itemMatches } = order

    // 이슈 유형 파악 (동적)
    const issues: string[] = []

    // 누락된 그룹 확인
    result.groupNames.forEach(groupName => {
      if (!existsInGroups[groupName]) {
        issues.push(`${groupName} 누락`)
      }
    })

    // 품목 수량 불일치 확인
    const mismatchedItems = itemMatches.filter(item => !item.matched)
    if (mismatchedItems.length > 0) {
      issues.push(`불일치 품목(${mismatchedItems.length})`)
    }

    return {
      주문번호: orderNumber,
      품목수: summary.totalItems,
      일치품목: summary.matchedItems,
      불일치품목: summary.totalItems - summary.matchedItems,
      일치율: `${summary.matchRate.toFixed(1)}%`,
      상태: itemMatches.every(item => item.matched) ? '완료' : '오류',
      이슈유형: issues.length > 0 ? issues.join(', ') : '-',
    }
  })
}

/**
 * 품목 상세 테이블 생성 (N-Way)
 *
 * 모든 그룹의 모든 품목을 동적 컬럼으로 표시합니다.
 *
 * @param result - N-Way 비교 결과
 * @returns 품목 상세 테이블 행 배열
 */
export function generateItemDetailTable(
  result: NWayComparisonResult,
): ItemDetailRow[] {
  const rows: ItemDetailRow[] = []

  result.orderResults.forEach(order => {
    order.itemMatches.forEach(item => {
      const {
        productName,
        quantities,
        matched,
        matchStatus,
        matchedGroupCount,
        missingInGroups,
        mismatchGroups,
      } = item

      // 동적 행 생성 (기본 필드 + 각 그룹 수량)
      const row: ItemDetailRow = {
        주문번호: order.orderNumber,
        품목명: formatProductName(productName),
        일치상태:
          matchStatus === 'COMPLETE'
            ? '✅ 완전 일치'
            : matchStatus === 'PARTIAL'
              ? `⚠️ 부분 일치 (${matchedGroupCount}/${result.groupNames.length})`
              : '❌ 불일치',
        이슈내용: '-',
      }

      // 각 그룹의 수량을 동적 컬럼으로 추가
      result.groupNames.forEach(groupName => {
        const qty = quantities[groupName]
        row[groupName] = qty !== null ? qty : '없음'
      })

      // 이슈 내용 생성
      if (!matched) {
        const issues: string[] = []

        if (missingInGroups && missingInGroups.length > 0) {
          issues.push(`누락: ${missingInGroups.join(', ')}`)
        }

        if (mismatchGroups && mismatchGroups.length > 0) {
          issues.push(`수량불일치: ${mismatchGroups.join(', ')}`)
        }

        row.이슈내용 = issues.length > 0 ? issues.join(' | ') : '불일치'
      }

      rows.push(row)
    })
  })

  return rows
}

/**
 * 불일치 상세 테이블 생성 (N-Way)
 *
 * 문제가 있는 항목만 모아서 동적 컬럼으로 표시합니다.
 *
 * @param result - N-Way 비교 결과
 * @returns 불일치 상세 테이블 행 배열
 */
export function generateMismatchDetailTable(
  result: NWayComparisonResult,
): MismatchDetailRow[] {
  const rows: MismatchDetailRow[] = []

  result.orderResults.forEach(order => {
    // 불일치 품목만 필터링
    const mismatches = order.itemMatches.filter(item => !item.matched)

    mismatches.forEach(item => {
      const { productName, quantities, missingInGroups, mismatchGroups } = item

      // 불일치 유형 판별
      let type = ''
      if (missingInGroups && missingInGroups.length > 0) {
        type = `품목 누락 (${missingInGroups.join(', ')})`
      } else if (mismatchGroups && mismatchGroups.length > 0) {
        type = `수량 불일치 (${mismatchGroups.join(', ')})`
      } else {
        type = '불일치'
      }

      // 동적 행 생성
      const row: MismatchDetailRow = {
        주문번호: order.orderNumber,
        품목명: formatProductName(productName),
        불일치유형: type,
        차이: '-',
        조치필요: '데이터 확인 필요',
      }

      // 각 그룹의 수량을 동적 컬럼으로 추가
      result.groupNames.forEach(groupName => {
        const qty = quantities[groupName]
        row[groupName] = qty !== null ? qty : '없음'
      })

      // 차이 계산 (기준 그룹 대비)
      const baseGroupName = result.groupNames[0]
      const baseQty = quantities[baseGroupName]

      if (baseQty !== null) {
        const diffs: string[] = []
        result.groupNames.slice(1).forEach(groupName => {
          const qty = quantities[groupName]
          if (qty !== null && qty !== baseQty) {
            const diff = qty - baseQty
            diffs.push(`${groupName}: ${diff > 0 ? '+' : ''}${diff}`)
          } else if (qty === null) {
            diffs.push(`${groupName}: 누락`)
          }
        })
        row.차이 = diffs.length > 0 ? diffs.join(', ') : '-'
      }

      rows.push(row)
    })
  })

  return rows
}

/**
 * 불일치 항목 테이블 생성 (N-Way)
 *
 * PARTIAL(부분 일치) 및 FAILED(완전 불일치) 항목을 모두 표시합니다.
 * [값 누락]과 [매핑 불일치]를 통합한 테이블입니다.
 *
 * @param result - N-Way 비교 결과
 * @returns 불일치 항목 테이블 행 배열
 */
export function generateMismatchItemsTable(
  result: NWayComparisonResult,
): MismatchDetailRow[] {
  const rows: MismatchDetailRow[] = []

  result.orderResults.forEach(order => {
    // PARTIAL 및 FAILED 품목만 필터링
    const mismatchItems = order.itemMatches.filter(
      item => item.matchStatus === 'PARTIAL' || item.matchStatus === 'FAILED',
    )

    mismatchItems.forEach(item => {
      const { productName, quantities, missingInGroups, matchedGroupCount, matchStatus } =
        item

      // 불일치 유형 결정
      let mismatchType = ''
      if (matchStatus === 'PARTIAL') {
        // 부분 일치: 일부 그룹에만 존재
        if (missingInGroups && missingInGroups.length > 0) {
          mismatchType = `품목 누락 (${missingInGroups.join(', ')})`
        } else {
          mismatchType = `부분 일치 (${matchedGroupCount}/${result.groupNames.length} 그룹)`
        }
      } else {
        // FAILED: 완전 불일치
        const baseGroupName = result.groupNames[0]
        const baseQty = quantities[baseGroupName]
        
        if (baseQty === null) {
          mismatchType = '기준 파일에 없음'
        } else {
          // 수량 불일치가 있는 그룹 찾기
          const mismatchGroups = result.groupNames.filter(groupName => {
            const qty = quantities[groupName]
            return qty !== null && qty !== baseQty
          })
          if (mismatchGroups.length > 0) {
            mismatchType = `수량 불일치 (${mismatchGroups.join(', ')})`
          } else {
            mismatchType = '불일치'
          }
        }
      }

      // 동적 행 생성
      const row: MismatchDetailRow = {
        주문번호: order.orderNumber,
        품목명: formatProductName(productName),
        불일치유형: mismatchType,
        차이: '-',
      }

      // 각 그룹의 수량을 동적 컬럼으로 추가
      result.groupNames.forEach(groupName => {
        const qty = quantities[groupName]
        row[groupName] = qty !== null ? qty : '없음'
      })

      // 차이 계산
      const baseGroupName = result.groupNames[0]
      const baseQty = quantities[baseGroupName]

      if (baseQty !== null) {
        const diffs: string[] = []
        result.groupNames.slice(1).forEach(groupName => {
          const qty = quantities[groupName]
          if (qty !== null && qty !== baseQty) {
            const diff = qty - baseQty
            diffs.push(`${groupName}: ${diff > 0 ? '+' : ''}${diff}`)
          } else if (qty === null) {
            diffs.push(`${groupName}: 누락`)
          }
        })
        row.차이 = diffs.length > 0 ? diffs.join(', ') : '-'
      } else {
        // 기준 그룹에 없는 경우
        row.차이 = '기준 파일에 없음'
      }

      rows.push(row)
    })
  })

  return rows
}

/**
 * @deprecated [값 누락]과 [매핑 불일치]를 통합한 generateMismatchItemsTable을 사용하세요
 */
export function generateMissingValueTable(
  result: NWayComparisonResult,
): MismatchDetailRow[] {
  return generateMismatchItemsTable(result)
}

/**
 * @deprecated [값 누락]과 [매핑 불일치]를 통합한 generateMismatchItemsTable을 사용하세요
 */
export function generateMappingMismatchTable(
  result: NWayComparisonResult,
): MismatchDetailRow[] {
  return generateMismatchItemsTable(result)
}

/**
 * "값 없음" 테이블 생성 (N-Way)
 *
 * Step 5에서 "__NONE__"으로 매핑된 항목만 필터링하여 반환합니다.
 * productName이 null이거나 'null'인 항목을 찾습니다.
 *
 * @param result - N-Way 비교 결과
 * @returns "값 없음" 항목 테이블 행 배열
 */
export function generateNoneValueTable(
  result: NWayComparisonResult,
): MismatchDetailRow[] {
  const rows: MismatchDetailRow[] = []

  console.log('\n🔍 [generateNoneValueTable] 테이블 생성 시작')
  console.log(`  - 총 주문 수: ${result.orderResults.length}`)

  result.orderResults.forEach(order => {
    order.itemMatches.forEach(item => {
      // productName이 null이거나 'null'인 항목만 필터링
      if (item.productName === null || item.productName === 'null') {
        // 🔍 디버깅: 특정 주문번호 추적
        const isDebugOrder =
          order.orderNumber === '20250916-0000208' ||
          order.orderNumber === '20250918-0000536'

        if (isDebugOrder) {
          console.log('\n🔍 [값 없음 테이블 생성] 주문번호:', order.orderNumber)
          console.log('  - productName:', item.productName)
          console.log(
            '  - originalComparisonValue:',
            item.originalComparisonValue,
          )
          console.log('  - quantities:', item.quantities)
          console.log('  - matchStatus:', item.matchStatus)
        }

        // 동적 그룹 열 추가 (각 그룹의 수량)
        const rowData: any = {
          주문번호: order.orderNumber,
          품목명: '값 없음 (매핑 제외)',
          비교파일값: item.originalComparisonValue || '(알 수 없음)',
          불일치유형: 'Step 5에서 매핑 제외된 항목',
        }
        result.groupNames.forEach(groupName => {
          const qty = item.quantities[groupName]
          rowData[groupName] =
            qty !== undefined && qty !== null ? String(qty) : '없음'
        })

        // 차이 계산 (첫 번째 그룹 대비)
        const firstGroupName = result.groupNames[0]
        const firstQty = item.quantities[firstGroupName] || 0
        const differences: string[] = []
        result.groupNames.slice(1).forEach(groupName => {
          const qty = item.quantities[groupName]
          if (qty === null || qty === undefined) {
            differences.push(`${groupName}: 누락`)
          } else {
            const diff = qty - firstQty
            if (diff !== 0) {
              differences.push(`${groupName}: ${diff > 0 ? '+' : ''}${diff}`)
            }
          }
        })
        rowData.차이 = differences.length > 0 ? differences.join(', ') : '-'

        const row: MismatchDetailRow = rowData as MismatchDetailRow

        rows.push(row)
      }
    })
  })

  console.log(
    `✅ [generateNoneValueTable] 테이블 생성 완료: ${rows.length}개 행`,
  )

  return rows
}

/**
 * 통계 요약 테이블 생성 (N-Way)
 *
 * 전체 통계를 요약하여 보여줍니다 (품목 레벨 독립 판별).
 *
 * @param result - N-Way 비교 결과
 * @returns 통계 요약 테이블 행 배열
 */
export function generateStatisticsTable(
  result: NWayComparisonResult,
): StatisticsRow[] {
  const { summary } = result

  return [
    {
      구분: '주문 건수',
      전체: summary.totalOrders,
      완전일치: 0, // 주문 레벨 상태는 제거됨
      부분일치: 0,
      불일치: 0,
      일치율: '-',
    },
    {
      구분: '품목 건수',
      전체: summary.totalItems,
      완전일치: summary.completeMatchItems,
      부분일치: summary.partialMatchItems,
      불일치: summary.failedItems,
      일치율: `${(summary.completeMatchRate || 0).toFixed(1)}%`,
    },
  ]
}

/**
 * 모든 테이블 한번에 생성 (N-Way)
 *
 * @param result - N-Way 비교 결과
 * @returns 모든 테이블 객체
 */
export function generateAllTables(result: NWayComparisonResult) {
  // console.log('📊 테이블 생성 시작...')
  // console.log(`  - 비교 대상 그룹: ${result.groupNames.length}개`)
  // console.log(`  - 그룹 목록: ${result.groupNames.join(', ')}`)

  const tables = {
    orderSummary: generateOrderSummaryTable(result), // 엑셀 출력용으로만 사용
    itemDetail: generateItemDetailTable(result),
    mismatchDetail: generateMismatchDetailTable(result),
    mismatchItems: generateMismatchItemsTable(result), // 불일치 항목 (값 누락 + 매핑 불일치 통합)
    noneValue: generateNoneValueTable(result), // 값 없음 (Step 5 매핑 제외)
    statistics: generateStatisticsTable(result), // 엑셀 출력용으로만 사용
  }

  // console.log('✅ 테이블 생성 완료')
  // console.log(`  - 품목 상세: ${tables.itemDetail.length}행`)
  // console.log(`  - 불일치 상세: ${tables.mismatchDetail.length}행`)

  return tables
}
