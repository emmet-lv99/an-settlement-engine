/**
 * ============================================
 * excelExportUtils.ts - 엑셀 내보내기 유틸
 * ============================================
 *
 * 비교 결과를 엑셀 파일로 내보내는 함수들입니다.
 */

import * as XLSX from 'xlsx'
import type { ThreeWayComparisonResult } from '../types/ComparisonTypes'
import { generateAllTables } from './tableUtils'

/**
 * 비교 결과를 엑셀 파일로 내보냅니다.
 */
export function exportComparisonResultToExcel(
  comparisonResult: ThreeWayComparisonResult,
): void {
  // console.log('📊 엑셀 파일 생성 시작...')

  // 테이블 데이터 생성
  const tables = generateAllTables(comparisonResult)
  const { orderSummary, itemDetail, mismatchDetail, statistics } = tables

  // 워크북 생성
  const wb = XLSX.utils.book_new()

  // 1. 통계 요약 시트
  const statsSheet = XLSX.utils.json_to_sheet(statistics)
  XLSX.utils.book_append_sheet(wb, statsSheet, '통계요약')
  // console.log(`✅ 통계요약 시트 생성 (${statistics.length}행)`)

  // 2. 주문 요약 시트
  const orderSheet = XLSX.utils.json_to_sheet(orderSummary)
  XLSX.utils.book_append_sheet(wb, orderSheet, '주문요약')
  // console.log(`✅ 주문요약 시트 생성 (${orderSummary.length}행)`)

  // 3. 품목 상세 시트
  const itemSheet = XLSX.utils.json_to_sheet(itemDetail)
  XLSX.utils.book_append_sheet(wb, itemSheet, '품목상세')
  // console.log(`✅ 품목상세 시트 생성 (${itemDetail.length}행)`)

  // 4. 불일치 상세 시트
  const mismatchSheet = XLSX.utils.json_to_sheet(mismatchDetail)
  XLSX.utils.book_append_sheet(wb, mismatchSheet, '불일치상세')
  // console.log(`✅ 불일치상세 시트 생성 (${mismatchDetail.length}행)`)

  // 파일명 생성 (현재 날짜/시간 포함)
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '')
  const fileName = `비교결과_${dateStr}_${timeStr}.xlsx`

  // 파일 다운로드
  XLSX.writeFile(wb, fileName)
  // console.log(`✅ 엑셀 파일 다운로드: ${fileName}`)
}
