/**
 * ============================================
 * comparisonUtils.ts - N-Way 데이터 비교 유틸
 * ============================================
 *
 * 1개 기준 그룹 + N개 비교 그룹을 비교합니다.
 * 주문번호 기준으로 그룹화 후, 각 주문 내 품목을 검증합니다.
 */

import type {
  ItemMatchResult,
  MergedGroup,
  NormalizedRow,
  NWayComparisonResult,
  OrderItem,
  OrderMatchResult,
  ThreeWayComparisonResult,
} from '../types/ComparisonTypes'

/**
 * 주문번호별로 데이터를 그룹화
 *
 * @param data - 정규화된 데이터
 * @param orderNumberKey - 주문번호 컬럼명
 * @param productNameKey - 상품명 컬럼명
 * @param quantityKey - 수량 컬럼명
 * @returns 주문번호별 품목 리스트
 */
function groupByOrderNumber(
  data: NormalizedRow[],
  orderNumberKey: string,
  productNameKey: string,
  quantityKey: string,
): Map<string, OrderItem[]> {
  const grouped = new Map<string, OrderItem[]>()

  data.forEach(row => {
    const orderNumber = String(row[orderNumberKey]).trim() // ✅ 앞뒤 공백 제거
    const productName = String(row[productNameKey])
    const quantity = Number(row[quantityKey])

    // 원본 품목명 추출 (정규화 이전 값)
    // productName이 null인 경우, __original_<columnName> 필드에서 원본 값 추출
    let originalProductName: string | undefined = undefined
    if (productName === 'null' || productName === null) {
      // ✅ __original_ 필드에서 원본 값 찾기 (Step 5에서 __NONE__ 매핑 시 저장됨)
      const originalKey = `__original_${productNameKey}`
      if (row[originalKey] !== undefined && row[originalKey] !== null) {
        originalProductName = String(row[originalKey])
      } else {
        // Fallback: 직접 컬럼에서 찾기 (하지만 이미 null일 가능성 높음)
        const possibleKeys = [
          '상품옵션',
          '상품명',
          '품목명',
          'productName',
          'product',
        ]
        for (const key of possibleKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            originalProductName = String(row[key])
            break
          }
        }
      }
    }

    if (!grouped.has(orderNumber)) {
      grouped.set(orderNumber, [])
    }

    grouped.get(orderNumber)!.push({
      productName,
      quantity,
      originalRow: row,
      originalProductName, // ✅ 원본 품목명 저장
    })
  })

  return grouped
}

/**
 * 단일 주문의 품목들을 3-way 비교
 *
 * @param orderNumber - 주문번호
 * @param supplierItems - 공급사 품목 리스트
 * @param purchaseItems - 발주서 품목 리스트
 * @param ordersItems - 주문 품목 리스트
 * @returns 주문별 매칭 결과
 */
function compareOrderItems(
  orderNumber: string,
  supplierItems: OrderItem[] | undefined,
  purchaseItems: OrderItem[] | undefined,
  ordersItems: OrderItem[] | undefined,
): OrderMatchResult {
  // Level 1: 주문 존재 여부
  const level1_exists = {
    supplier: !!supplierItems,
    purchase: !!purchaseItems,
    orders: !!ordersItems,
  }

  // Level 2 & 3: 품목별 매칭 및 수량 검증
  const itemMatches: ItemMatchResult[] = []

  // 빈 배열로 초기화 (없는 파일은 빈 배열로 처리)
  const safeSupplierItems = supplierItems || []
  const safePurchaseItems = purchaseItems || []
  const safeOrdersItems = ordersItems || []

  // 공급사 정산내역을 기준으로 순회
  safeSupplierItems.forEach(supplierItem => {
    // 동일 품목 찾기
    const purchaseItem = safePurchaseItems.find(
      item => item.productName === supplierItem.productName,
    )
    const ordersItem = safeOrdersItems.find(
      item => item.productName === supplierItem.productName,
    )

    // Level 2: 품목 존재 여부
    if (!purchaseItem) {
      const quantities = {
        supplier: supplierItem.quantity,
        purchase: null as number | null,
        orders: ordersItem?.quantity || null,
      }
      itemMatches.push({
        matched: false,
        productName: supplierItem.productName,
        matchStatus: 'FAILED',
        matchedGroupCount: ordersItem ? 2 : 1,
        quantities,
        supplierQty: supplierItem.quantity,
        purchaseQty: null,
        ordersQty: ordersItem?.quantity || null,
        issueType: 'missing_in_purchase',
        difference: {
          purchase: supplierItem.quantity,
          orders: ordersItem
            ? supplierItem.quantity - ordersItem.quantity
            : supplierItem.quantity,
        },
      })
      return
    }

    if (!ordersItem) {
      const quantities = {
        supplier: supplierItem.quantity,
        purchase: purchaseItem.quantity,
        orders: null as number | null,
      }
      itemMatches.push({
        matched: false,
        productName: supplierItem.productName,
        matchStatus: 'FAILED',
        matchedGroupCount: 2,
        quantities,
        supplierQty: supplierItem.quantity,
        purchaseQty: purchaseItem.quantity,
        ordersQty: null,
        issueType: 'missing_in_orders',
        difference: {
          purchase: supplierItem.quantity - purchaseItem.quantity,
          orders: supplierItem.quantity,
        },
      })
      return
    }

    // Level 3: 수량 일치 여부
    const quantityMatched =
      supplierItem.quantity === purchaseItem.quantity &&
      supplierItem.quantity === ordersItem.quantity

    const quantities = {
      supplier: supplierItem.quantity,
      purchase: purchaseItem.quantity,
      orders: ordersItem.quantity,
    }

    itemMatches.push({
      matched: quantityMatched,
      productName: supplierItem.productName,
      matchStatus: quantityMatched ? 'COMPLETE' : 'FAILED',
      matchedGroupCount: quantityMatched ? 3 : 3,
      quantities,
      supplierQty: supplierItem.quantity,
      purchaseQty: purchaseItem.quantity,
      ordersQty: ordersItem.quantity,
      issueType: quantityMatched ? undefined : 'quantity_mismatch',
      difference: {
        purchase: supplierItem.quantity - purchaseItem.quantity,
        orders: supplierItem.quantity - ordersItem.quantity,
      },
    })
  })

  // 발주서에만 있는 품목 추가 (공급사 정산내역에 없는 품목)
  safePurchaseItems.forEach(purchaseItem => {
    const existsInSupplier = safeSupplierItems.some(
      item => item.productName === purchaseItem.productName,
    )
    if (!existsInSupplier) {
      const ordersItem = safeOrdersItems.find(
        item => item.productName === purchaseItem.productName,
      )
      const quantities = {
        supplier: 0 as number | null,
        purchase: purchaseItem.quantity,
        orders: ordersItem?.quantity || null,
      }
      itemMatches.push({
        matched: false,
        productName: purchaseItem.productName,
        matchStatus: 'FAILED',
        matchedGroupCount: ordersItem ? 2 : 1,
        quantities,
        supplierQty: 0, // 공급사에 없음
        purchaseQty: purchaseItem.quantity,
        ordersQty: ordersItem?.quantity || null,
        issueType: 'missing_in_supplier',
        difference: {
          purchase: 0,
          orders: 0,
        },
      })
    }
  })

  // 주문에만 있는 품목 추가 (공급사 정산내역과 발주서에 없는 품목)
  safeOrdersItems.forEach(ordersItem => {
    const existsInSupplier = safeSupplierItems.some(
      item => item.productName === ordersItem.productName,
    )
    const existsInPurchase = safePurchaseItems.some(
      item => item.productName === ordersItem.productName,
    )
    if (!existsInSupplier && !existsInPurchase) {
      const quantities = {
        supplier: 0 as number | null,
        purchase: null as number | null,
        orders: ordersItem.quantity,
      }
      itemMatches.push({
        matched: false,
        productName: ordersItem.productName,
        matchStatus: 'FAILED',
        matchedGroupCount: 1,
        quantities,
        supplierQty: 0, // 공급사에 없음
        purchaseQty: null, // 발주서에도 없음
        ordersQty: ordersItem.quantity,
        issueType: 'missing_in_supplier_and_purchase',
        difference: {
          purchase: 0,
          orders: 0,
        },
      })
    }
  })

  // 요약 정보 계산 (품목 레벨만)
  const matchedItems = itemMatches.filter(item => item.matched).length
  const totalItems = itemMatches.length // supplierItems.length에서 itemMatches.length로 변경
  const matchRate = totalItems > 0 ? (matchedItems / totalItems) * 100 : 0

  return {
    orderNumber,
    existsInGroups: {
      supplier: !!supplierItems,
      purchase: !!purchaseItems,
      orders: !!ordersItems,
    },
    itemMatches,
    summary: {
      totalItems,
      matchedItems,
      matchRate,
    },
    level1_exists,
    level2_itemMatch: itemMatches,
  }
}

/**
 * 3-Way 비교 메인 함수
 *
 * 공급사 정산내역 - 발주서 - 주문 파일을 비교합니다.
 *
 * @param supplierData - 공급사 정산내역 (정규화됨)
 * @param purchaseData - 발주서 (정규화됨)
 * @param ordersData - 주문 병합 데이터 (정규화됨)
 * @param keyColumn - 주문번호 컬럼명
 * @param productColumn - 상품명 컬럼명
 * @param quantityColumn - 수량 컬럼명
 * @returns 3-way 비교 결과
 */
export function compareThreeWay(
  supplierData: NormalizedRow[],
  purchaseData: NormalizedRow[],
  ordersData: NormalizedRow[],
  keyColumn: string,
  productColumn: string,
  quantityColumn: string,
): ThreeWayComparisonResult {
  // 1. 주문번호별 그룹화
  const supplierOrders = groupByOrderNumber(
    supplierData,
    keyColumn,
    productColumn,
    quantityColumn,
  )
  const purchaseOrders = groupByOrderNumber(
    purchaseData,
    keyColumn,
    productColumn,
    quantityColumn,
  )
  const ordersOrders = groupByOrderNumber(
    ordersData,
    keyColumn,
    productColumn,
    quantityColumn,
  )

  // 2. 모든 주문번호 수집 (합집합)
  const allOrderNumbers = new Set([
    ...supplierOrders.keys(),
    ...purchaseOrders.keys(),
    ...ordersOrders.keys(),
  ])

  // 3. 주문번호별 비교
  const results: OrderMatchResult[] = []

  allOrderNumbers.forEach(orderNumber => {
    const result = compareOrderItems(
      orderNumber,
      supplierOrders.get(orderNumber),
      purchaseOrders.get(orderNumber),
      ordersOrders.get(orderNumber),
    )
    results.push(result)
  })

  // 4. 전체 통계 계산 (품목 레벨 기준)
  const totalItems = results.reduce((sum, r) => sum + r.summary.totalItems, 0)
  const matchedItems = results.reduce(
    (sum, r) => sum + r.summary.matchedItems,
    0,
  )
  const mismatchedItems = totalItems - matchedItems

  // 모든 품목 수집
  const allItemMatches: ItemMatchResult[] = []
  results.forEach(order => {
    allItemMatches.push(...order.itemMatches)
  })

  const completeMatchItems = allItemMatches.filter(
    (item: ItemMatchResult) => item.matchStatus === 'COMPLETE',
  ).length
  const partialMatchItems = allItemMatches.filter(
    (item: ItemMatchResult) => item.matchStatus === 'PARTIAL',
  ).length
  const failedItems = allItemMatches.filter(
    (item: ItemMatchResult) => item.matchStatus === 'FAILED',
  ).length
  const noneValueItems = allItemMatches.filter(
    (item: ItemMatchResult) => item.originalComparisonValue !== undefined,
  ).length

  return {
    groupNames: ['supplier', 'purchase', 'orders'],
    orderResults: results,
    summary: {
      totalOrders: results.length,
      totalItems,
      completeMatchItems,
      partialMatchItems,
      failedItems,
      noneValueItems,
      completeMatchRate:
        totalItems > 0 ? (completeMatchItems / totalItems) * 100 : 0,
      matchedItems,
      mismatchedItems,
      itemMatchRate: (matchedItems / totalItems) * 100,
    },
  }
}

/**
 * ============================================
 * N-Way 비교 함수
 * ============================================
 */

/**
 * N-Way 비교 메인 함수
 *
 * 첫 번째 그룹을 기준으로, 나머지 모든 그룹과 비교합니다.
 * 모든 그룹에 동일한 품목이 존재하고 수량이 일치해야 "완전 일치"로 판정합니다.
 *
 * @param groups - 비교할 그룹 배열 (첫 번째가 기준)
 * @param keyColumn - 주문번호 컬럼명
 * @param productColumn - 상품명 컬럼명
 * @param quantityColumn - 수량 컬럼명
 * @returns N-Way 비교 결과
 */
export function compareNWay(
  groups: MergedGroup[],
  keyColumn: string,
  productColumn: string,
  quantityColumn: string,
): NWayComparisonResult {
  // 그룹명 추출
  const groupNames = groups.map(g => g.groupTitle)

  // Step 1: 각 그룹의 데이터를 주문번호별로 그룹화
  const groupedDataByGroup: Map<string, OrderItem[]>[] = groups.map(group =>
    groupByOrderNumber(group.data, keyColumn, productColumn, quantityColumn),
  )

  // Step 2: 모든 주문번호 수집 (합집합)
  const allOrderNumbers = new Set<string>()
  groupedDataByGroup.forEach(groupedData => {
    groupedData.forEach((_, orderNumber) => {
      allOrderNumbers.add(orderNumber)
    })
  })

  // Step 3: 주문번호별 N-Way 비교
  const results: OrderMatchResult[] = []

  allOrderNumbers.forEach(orderNumber => {
    const result = compareOrderItemsNWay(
      orderNumber,
      groupNames,
      groupedDataByGroup,
    )
    results.push(result)
  })

  // Step 4: 전체 통계 계산 (품목 레벨 기준, 상태별 집계)
  const totalItems = results.reduce((sum, r) => sum + r.summary.totalItems, 0)

  // 모든 품목의 매칭 결과 수집
  const allItemMatches: ItemMatchResult[] = []
  results.forEach(r => {
    allItemMatches.push(...r.itemMatches)
  })

  // 상태별 집계
  const completeMatchItems = allItemMatches.filter(
    item => item.matchStatus === 'COMPLETE',
  ).length
  const partialMatchItems = allItemMatches.filter(
    item => item.matchStatus === 'PARTIAL',
  ).length
  const failedItems = allItemMatches.filter(
    item => item.matchStatus === 'FAILED',
  ).length

  // "값 없음" 항목 집계 (productName이 null인 항목)
  const noneValueItems = allItemMatches.filter(
    item => item.productName === null || item.productName === 'null',
  ).length

  return {
    groupNames,
    orderResults: results,
    summary: {
      totalOrders: results.length,
      totalItems,
      completeMatchItems,
      partialMatchItems,
      failedItems,
      noneValueItems,
      completeMatchRate:
        totalItems > 0 ? (completeMatchItems / totalItems) * 100 : 0,
    },
  }
}

/**
 * 단일 주문의 품목들을 N-Way 비교
 *
 * @param orderNumber - 주문번호
 * @param groupNames - 그룹명 배열
 * @param groupedDataByGroup - 각 그룹의 주문번호별 품목 Map
 * @returns 주문별 매칭 결과
 */
function compareOrderItemsNWay(
  orderNumber: string,
  groupNames: string[],
  groupedDataByGroup: Map<string, OrderItem[]>[],
): OrderMatchResult {
  // Step 1: 각 그룹에서 해당 주문번호의 품목 가져오기
  const itemsByGroup: (OrderItem[] | undefined)[] = groupedDataByGroup.map(
    groupedData => groupedData.get(orderNumber),
  )

  // Step 2: 각 그룹별 주문 존재 여부
  const existsInGroups: Record<string, boolean> = {}
  groupNames.forEach((groupName, idx) => {
    existsInGroups[groupName] = !!itemsByGroup[idx]
  })

  // Step 3: 모든 그룹의 품목을 하나의 배열로 병합 (중복 제거)
  // ✅ productName이 "null"인 경우, originalProductName을 사용하여 고유성 보장
  const allProductNames = new Set<string>()
  itemsByGroup.forEach(items => {
    items?.forEach(item => {
      if (item.productName === 'null' && item.originalProductName) {
        // "null" 품목은 originalProductName을 사용 (고유 식별)
        allProductNames.add(`__NULL__:${item.originalProductName}`)
      } else {
        allProductNames.add(item.productName)
      }
    })
  })

  // Step 4: 품목별 N-Way 비교
  const itemMatches: ItemMatchResult[] = []

  allProductNames.forEach(productNameKey => {
    // ✅ productNameKey가 "__NULL__:"로 시작하면 null 품목
    const isNullProduct = productNameKey.startsWith('__NULL__:')
    const actualProductName = isNullProduct ? 'null' : productNameKey
    const targetOriginalName = isNullProduct
      ? productNameKey.replace('__NULL__:', '')
      : null

    // 각 그룹에서 해당 품목의 수량 찾기
    const quantities: Record<string, number | null> = {}
    const missingInGroups: string[] = []
    const mismatchGroups: string[] = []

    // 원본 비교 파일 값 추출 (productName이 null일 경우에만)
    let originalComparisonValue: string | null = targetOriginalName

    groupNames.forEach((groupName, idx) => {
      const items = itemsByGroup[idx]

      // 🔧 매칭 조건: null 품목은 originalProductName으로, 일반 품목은 productName으로 매칭
      const matchingItems =
        items?.filter(it => {
          if (isNullProduct) {
            // null 품목: originalProductName으로 매칭
            return (
              it.productName === 'null' &&
              it.originalProductName === targetOriginalName
            )
          } else {
            // 일반 품목: productName으로 매칭
            return it.productName === actualProductName
          }
        }) || []

      if (matchingItems.length > 0) {
        // 수량 합산
        const totalQuantity = matchingItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        )
        quantities[groupName] = totalQuantity
      } else {
        quantities[groupName] = null
        missingInGroups.push(groupName)
      }
    })

    // 완전 일치 판정: 모든 그룹에 존재하고, 수량이 모두 동일
    const allQuantities = Object.values(quantities).filter(
      q => q !== null,
    ) as number[]
    const firstQty = allQuantities[0]
    const allMatch =
      missingInGroups.length === 0 && allQuantities.every(q => q === firstQty)

    // 수량 불일치 그룹 찾기
    if (missingInGroups.length === 0 && !allMatch) {
      groupNames.forEach(groupName => {
        if (quantities[groupName] !== firstQty) {
          mismatchGroups.push(groupName)
        }
      })
    }

    // 🔧 매칭 상태 판별 (그룹 수에 따라 다름)
    const totalGroups = groupNames.length
    const existingGroupCount = allQuantities.length // 품목이 존재하는 그룹 수
    let matchStatus: 'COMPLETE' | 'PARTIAL' | 'FAILED'
    let matchedGroupCount = 0

    if (totalGroups === 2) {
      // 2-Way: 일치 or 불일치만
      matchStatus = allMatch ? 'COMPLETE' : 'FAILED'
      matchedGroupCount = allMatch
        ? 2
        : existingGroupCount === 2
          ? 0
          : existingGroupCount
    } else {
      // 3-Way 이상: 완전/부분/불일치
      if (allMatch) {
        // 모든 그룹에 존재하고 수량도 일치
        matchStatus = 'COMPLETE'
        matchedGroupCount = totalGroups
      } else if (existingGroupCount <= 1) {
        // 0개 또는 1개 그룹에만 존재
        matchStatus = 'FAILED'
        matchedGroupCount = existingGroupCount
      } else {
        // 2개 이상 그룹에 존재하지만 완전 일치는 아님
        matchStatus = 'PARTIAL'
        // 수량이 일치하는 그룹 수 계산
        const quantityMatchCount = allQuantities.filter(
          q => q === firstQty,
        ).length
        matchedGroupCount = quantityMatchCount
      }
    }

    itemMatches.push({
      matched: allMatch,
      matchStatus,
      matchedGroupCount,
      productName: actualProductName, // ✅ "null" 또는 실제 상품명
      quantities,
      missingInGroups: missingInGroups.length > 0 ? missingInGroups : undefined,
      mismatchGroups: mismatchGroups.length > 0 ? mismatchGroups : undefined,
      originalComparisonValue, // 원본 비교 파일 값 추가
    })
  })

  // Step 5: 요약 정보 계산
  const matchedItems = itemMatches.filter(item => item.matched).length
  const totalItems = itemMatches.length
  const matchRate = totalItems > 0 ? (matchedItems / totalItems) * 100 : 0

  return {
    orderNumber,
    existsInGroups,
    itemMatches,
    summary: {
      totalItems,
      matchedItems,
      matchRate,
    },
  }
}
