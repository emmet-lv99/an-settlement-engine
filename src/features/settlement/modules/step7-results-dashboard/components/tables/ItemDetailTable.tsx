/**
 * ============================================
 * ItemDetailTable.tsx - 품목 상세 테이블 (N-Way)
 * ============================================
 *
 * 품목별 비교 상세 정보를 동적 컬럼으로 표시하는 테이블입니다.
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
import type { ItemDetailRow } from '../../types/ComparisonTypes'

interface ItemDetailTableProps {
  data: ItemDetailRow[]
  groupNames: string[]
}

type Order = 'asc' | 'desc'

const ItemDetailTable = ({ data, groupNames }: ItemDetailTableProps) => {
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<string>('일치상태')

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // 정렬 함수
  const getComparator = (order: Order, orderBy: string) => {
    return (a: ItemDetailRow, b: ItemDetailRow) => {
      const aValue = a[orderBy]
      const bValue = b[orderBy]

      // 일치상태 정렬 우선순위: ✅ 완전 일치 > ⚠️ 부분 일치 > ❌ 불일치
      if (orderBy === '일치상태') {
        const getPriority = (status: string | number) => {
          const str = String(status)
          if (str.includes('✅')) return 1
          if (str.includes('⚠️')) return 2
          if (str.includes('❌')) return 3
          return 4
        }

        const aPriority = getPriority(aValue)
        const bPriority = getPriority(bValue)

        if (order === 'asc') {
          return aPriority - bPriority
        }
        return bPriority - aPriority
      }

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

      // 한글/문자열 정렬
      const aStr = String(aValue)
      const bStr = String(bValue)

      const comparison = aStr.localeCompare(bStr, 'ko-KR')

      return order === 'asc' ? comparison : -comparison
    }
  }

  const sortedData = [...data].sort(getComparator(order, orderBy))

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
            <TableCell align="center">
              <TableSortLabel
                active={orderBy === '일치상태'}
                direction={orderBy === '일치상태' ? order : 'asc'}
                onClick={() => handleRequestSort('일치상태')}
              >
                일치상태
                {orderBy === '일치상태' ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
            <TableCell>이슈내용</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{row.주문번호}</TableCell>
              <TableCell>{row.품목명}</TableCell>
              {/* 동적 데이터: 각 그룹의 수량 */}
              {groupNames.map(groupName => (
                <TableCell key={groupName} align="right">
                  {row[groupName]}
                </TableCell>
              ))}
              <TableCell align="center">{row.일치상태}</TableCell>
              <TableCell>{row.이슈내용}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ItemDetailTable
