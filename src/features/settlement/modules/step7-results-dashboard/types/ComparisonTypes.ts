/**
 * ============================================
 * ComparisonTypes.ts - 비교 기능 타입 정의
 * ============================================
 *
 * Step 7 비교 기능에서 사용하는 모든 타입을 정의합니다.
 */

/**
 * 정규화된 행 데이터
 *
 * 4~6단계 규칙이 모두 적용된 깨끗한 데이터
 * - 4단계: 열 매핑 적용 (원본 컬럼명 → 기준 컬럼명)
 * - 5단계: 값 매핑 적용 (비표준 값 → 표준 값)
 * - 6단계: 수량 규칙 적용 (조건별 수량 곱셈)
 */
export interface NormalizedRow {
  // 3단계에서 선택한 키 컬럼 (예: "주문번호")
  [keyColumn: string]: string | number

  // 나머지 매핑된 컬럼들
  // 예: { "주문번호": "12345", "상품명": "생생효소", "수량": 2 }
}

/**
 * 파일별 정규화 결과
 */
export interface NormalizedFile {
  /** 파일명 */
  fileName: string
  /** 정규화된 데이터 배열 */
  data: NormalizedRow[]
  /** 총 행 개수 */
  rowCount: number
}

/**
 * 그룹별 병합 결과
 */
export interface MergedGroup {
  /** 그룹 ID (예: "group-1") */
  groupId: string
  /** 그룹 제목 (예: "업로드된 파일") */
  groupTitle: string
  /** 포함된 파일명 목록 */
  files: string[]
  /** 병합된 데이터 (모든 파일의 데이터가 합쳐진 것) */
  data: NormalizedRow[]
  /** 총 행 개수 */
  rowCount: number
}

/**
 * 비교 결과 - 일치/불일치 정보
 */
export interface ComparisonResult {
  /** 비교 모드 */
  mode: 'BASIC' | 'ADVANCED'

  /** BASIC 모드: 파일 간 비교 결과 */
  fileComparisons?: FileComparison[]

  /** ADVANCED 모드: 그룹 간 비교 결과 */
  groupComparisons?: GroupComparison[]

  /** 요약 정보 */
  summary: {
    /** 총 행 개수 */
    totalRows: number
    /** 일치하는 행 개수 */
    matchedRows: number
    /** 불일치하는 행 개수 */
    unmatchedRows: number
    /** 일치율 (0~100) */
    matchRate: number
  }
}

/**
 * 파일 간 비교 결과 (BASIC 모드)
 */
export interface FileComparison {
  /** 비교할 첫 번째 파일명 */
  file1: string
  /** 비교할 두 번째 파일명 */
  file2: string
  /** 두 파일에서 모두 발견된 행 */
  matched: NormalizedRow[]
  /** file1에만 있는 행 */
  onlyInFile1: NormalizedRow[]
  /** file2에만 있는 행 */
  onlyInFile2: NormalizedRow[]
}

/**
 * 그룹 간 비교 결과 (ADVANCED 모드)
 */
export interface GroupComparison {
  /** 비교할 첫 번째 그룹 */
  group1: MergedGroup
  /** 비교할 두 번째 그룹 */
  group2: MergedGroup
  /** 두 그룹에서 모두 발견된 행 */
  matched: NormalizedRow[]
  /** group1에만 있는 행 */
  onlyInGroup1: NormalizedRow[]
  /** group2에만 있는 행 */
  onlyInGroup2: NormalizedRow[]
}

/**
 * ============================================
 * N-Way 비교 타입 (1개 기준 + N개 비교 대상)
 * ============================================
 */

/**
 * 품목 정보
 */
export interface OrderItem {
  /** 품목명 (정규화됨) */
  productName: string
  /** 수량 (보정됨) */
  quantity: number
  /** 원본 행 데이터 */
  originalRow: NormalizedRow
  /** 원본 품목명 (정규화되기 전) */
  originalProductName?: string
}

/**
 * 품목 매칭 상태
 */
export type ItemMatchStatus = 'COMPLETE' | 'PARTIAL' | 'FAILED'

/**
 * 품목 매칭 결과 (N-Way)
 */
export interface ItemMatchResult {
  /** 완전 일치 여부 (모든 그룹에 존재하고 수량이 모두 일치) */
  matched: boolean
  /** 매칭 상태 (COMPLETE: 완전일치, PARTIAL: 부분일치, FAILED: 불일치) */
  matchStatus: ItemMatchStatus
  /** 일치하는 그룹 개수 (품목이 존재하고 수량이 일치하는 그룹 수) */
  matchedGroupCount: number
  /** 품목명 */
  productName: string
  /** 각 그룹별 수량 (동적) */
  quantities: Record<string, number | null>
  // 예: { "정산내역": 10, "발주서": 10, "주문_그레인": 10 }
  /** 누락된 그룹 목록 */
  missingInGroups?: string[]
  /** 수량 불일치 그룹 목록 */
  mismatchGroups?: string[]
  /** 원본 비교 파일 값 (Step 5에서 __NONE__으로 매핑되기 전의 원본 값) */
  originalComparisonValue?: string | null
  /** 임시 필드: 비교 중간 계산에서 사용하는 공급사 수량 */
  supplierQty?: number
  /** 임시 필드: 비교 중간 계산에서 사용하는 발주서 수량 */
  purchaseQty?: number | null
  /** 임시 필드: 비교 중간 계산에서 사용하는 주문 수량 */
  ordersQty?: number | null
  /** 임시 필드: 이슈 유형 */
  issueType?: string
  /** 임시 필드: 차이 */
  difference?: {
    purchase?: number
    orders?: number
  }
}

/**
 * 주문별 매칭 결과 (N-Way)
 */
export interface OrderMatchResult {
  /** 주문번호 */
  orderNumber: string
  /** 각 그룹별 주문 존재 여부 (동적) */
  existsInGroups: Record<string, boolean>
  // 예: { "정산내역": true, "발주서": true, "주문_그레인": false }
  /** 품목별 매칭 결과 (각 품목이 독립적으로 판별됨) */
  itemMatches: ItemMatchResult[]
  /** 요약 정보 (품목 통계) */
  summary: {
    /** 총 품목 수 */
    totalItems: number
    /** 일치하는 품목 수 */
    matchedItems: number
    /** 일치율 (0~100) */
    matchRate: number
  }
  /** 레거시 필드: 레벨1 존재 여부 */
  level1_exists?: Record<string, boolean>
  /** 레거시 필드: 레벨2 품목 매칭 */
  level2_itemMatch?: ItemMatchResult[]
}

/**
 * N-Way 전체 비교 결과
 */
export interface NWayComparisonResult {
  /** 비교 대상 그룹명 목록 (순서: 기준 그룹 + 비교 그룹들) */
  groupNames: string[]
  // 예: ["정산내역", "발주서", "주문_그레인"]
  /** 주문별 결과 */
  orderResults: OrderMatchResult[]
  /** 전체 요약 (품목 기준으로 집계) */
  summary: {
    /** 총 주문 건수 */
    totalOrders: number
    /** 총 품목 수 */
    totalItems: number
    /** 완전 일치 품목 수 (모든 그룹에 존재하고 수량 일치) */
    completeMatchItems: number
    /** 부분 일치 품목 수 (일부 그룹에만 존재, 3-Way 이상에서만 의미 있음) */
    partialMatchItems: number
    /** 불일치 품목 수 (0~1개 그룹에만 존재) */
    failedItems: number
    /** "값 없음" 품목 수 (Step 5에서 __NONE__으로 매핑된 항목) */
    noneValueItems: number
    /** 완전 일치율 (%) */
    completeMatchRate: number
    /** 일치 품목 수 (일부 로직에서 필요) */
    matchedItems?: number
    /** 불일치 품목 수 (레거시 용도) */
    mismatchedItems?: number
    /** 품목 일치율 (레거시 용도) */
    itemMatchRate?: number
  }
}

/**
 * 3-Way 전체 비교 결과 (하위 호환성을 위해 유지)
 * @deprecated NWayComparisonResult를 사용하세요
 */
export type ThreeWayComparisonResult = NWayComparisonResult

/**
 * ============================================
 * 엑셀 출력용 테이블 타입
 * ============================================
 */

/**
 * 주문 요약 테이블 행
 */
export interface OrderSummaryRow {
  주문번호: string
  품목수: number
  일치품목: number
  불일치품목: number
  일치율: string // "85.5%"
  상태: string
  이슈유형: string
}

/**
 * 품목 상세 테이블 행 (N-Way)
 */
export interface ItemDetailRow {
  주문번호: string
  품목명: string
  // 동적 컬럼: 각 그룹의 수량
  [groupName: string]: string | number
  // 예: "정산내역": 10, "발주서": 10, "주문_그레인": "없음"
  일치상태: string // "✅ 완전 일치", "⚠️ 부분 일치", "❌ 불일치"
  이슈내용: string
}

/**
 * 불일치 상세 테이블 행 (N-Way)
 */
export interface MismatchDetailRow {
  주문번호: string
  품목명: string
  비교파일값?: string // "값 없음" 탭에서만 사용 (Step 5 매핑 전 원본 값)
  불일치유형?: string // 값 누락 탭에서만 사용
  // 동적 컬럼: 각 그룹의 수량
  [groupName: string]: string | number | undefined
  // 예: "정산내역": 10, "발주서": 8, "주문_그레인": "없음"
  차이: string // "발주서: -2, 주문_그레인: 누락"
}

/**
 * 통계 요약 테이블 행
 */
export interface StatisticsRow {
  구분: string
  전체: number
  완전일치: number
  부분일치: number
  불일치: number
  일치율: string // "85.5%"
}
