/**
 * ============================================
 * MismatchDetailTable.tsx - 불일치 상세 테이블 (N-Way)
 * ============================================
 *
 * 불일치 항목만 동적 컬럼으로 표시하는 테이블입니다.
 */

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { useState } from 'react'
import type { MismatchDetailRow } from '../../types/ComparisonTypes'

interface MismatchDetailTableProps {
  data: MismatchDetailRow[]
  groupNames: string[]
  showMismatchType?: boolean // 불일치유형 컬럼 표시 여부 (기본값: true)
  showComparisonValue?: boolean // 비교파일값 컬럼 표시 여부 (기본값: false)
}

type Order = 'asc' | 'desc'

const MismatchDetailTable = ({
  data,
  groupNames,
  showMismatchType = true,
  showComparisonValue = false,
}: MismatchDetailTableProps) => {
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<string>('')

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // 한글/숫자 정렬 함수
  const getComparator = (order: Order, orderBy: string) => {
    return (a: MismatchDetailRow, b: MismatchDetailRow) => {
      if (!orderBy) return 0 // 정렬 컬럼이 없으면 원래 순서 유지

      const aValue = a[orderBy]
      const bValue = b[orderBy]

      // null/undefined/"없음" 처리
      const isEmptyA = aValue == null || aValue === '없음'
      const isEmptyB = bValue == null || bValue === '없음'

      if (isEmptyA && isEmptyB) return 0
      if (isEmptyA) return order === 'asc' ? 1 : -1 // 빈 값은 뒤로
      if (isEmptyB) return order === 'asc' ? -1 : 1

      // 숫자인 경우 숫자 정렬
      const aNum = Number(aValue)
      const bNum = Number(bValue)

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return order === 'asc' ? aNum - bNum : bNum - aNum
      }

      // 한글/문자열 정렬 (localeCompare 사용)
      const aStr = String(aValue)
      const bStr = String(bValue)

      const comparison = aStr.localeCompare(bStr, 'ko-KR')

      return order === 'asc' ? comparison : -comparison
    }
  }

  const sortedData = orderBy
    ? [...data].sort(getComparator(order, orderBy))
    : data

  return (
    <TableContainer component={Paper} sx={{ maxHeight: '600px' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === '주문번호'}
                direction={orderBy === '주문번호' ? order : 'asc'}
                onClick={() => handleRequestSort('주문번호')}
              >
                주문번호
                {orderBy === '주문번호' ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === '품목명'}
                direction={orderBy === '품목명' ? order : 'asc'}
                onClick={() => handleRequestSort('품목명')}
              >
                품목명
                {orderBy === '품목명' ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
            {/* 비교파일값 컬럼 (조건부 렌더링) */}
            {showComparisonValue && (
              <TableCell>
                <TableSortLabel
                  active={orderBy === '비교파일값'}
                  direction={orderBy === '비교파일값' ? order : 'asc'}
                  onClick={() => handleRequestSort('비교파일값')}
                >
                  비교 파일 값
                  {orderBy === '비교파일값' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc'
                        ? 'sorted descending'
                        : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )}
            {/* 불일치유형 컬럼 (조건부 렌더링) */}
            {showMismatchType && (
              <TableCell>
                <TableSortLabel
                  active={orderBy === '불일치유형'}
                  direction={orderBy === '불일치유형' ? order : 'asc'}
                  onClick={() => handleRequestSort('불일치유형')}
                >
                  불일치유형
                  {orderBy === '불일치유형' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc'
                        ? 'sorted descending'
                        : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )}
            {/* 동적 컬럼: 각 그룹의 수량 (정렬 가능) */}
            {groupNames.map(groupName => (
              <TableCell key={groupName} align="right">
                <TableSortLabel
                  active={orderBy === groupName}
                  direction={orderBy === groupName ? order : 'asc'}
                  onClick={() => handleRequestSort(groupName)}
                >
                  {groupName}
                  {orderBy === groupName ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc'
                        ? 'sorted descending'
                        : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell>차이</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{row.주문번호}</TableCell>
              <TableCell>{row.품목명}</TableCell>
              {/* 비교파일값 컬럼 (조건부 렌더링) */}
              {showComparisonValue && <TableCell>{row.비교파일값}</TableCell>}
              {/* 불일치유형 컬럼 (조건부 렌더링) */}
              {showMismatchType && <TableCell>{row.불일치유형}</TableCell>}
              {/* 동적 데이터: 각 그룹의 수량 */}
              {groupNames.map(groupName => (
                <TableCell key={groupName} align="right">
                  {row[groupName]}
                </TableCell>
              ))}
              <TableCell>{row.차이}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default MismatchDetailTable
