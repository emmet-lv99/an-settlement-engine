/**
 * ============================================
 * OrderSummaryTable.tsx - 주문 요약 테이블
 * ============================================
 *
 * 주문번호별 일치율과 상태를 표시하는 테이블입니다.
 */

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { OrderSummaryRow } from '../../types/ComparisonTypes'

interface OrderSummaryTableProps {
  data: OrderSummaryRow[]
}

const OrderSummaryTable = ({ data }: OrderSummaryTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>주문번호</TableCell>
            <TableCell align="right">품목수</TableCell>
            <TableCell align="right">일치품목</TableCell>
            <TableCell align="right">불일치품목</TableCell>
            <TableCell align="right">일치율</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>이슈유형</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{row.주문번호}</TableCell>
              <TableCell align="right">{row.품목수}</TableCell>
              <TableCell align="right">{row.일치품목}</TableCell>
              <TableCell align="right">{row.불일치품목}</TableCell>
              <TableCell align="right">{row.일치율}</TableCell>
              <TableCell>{row.상태}</TableCell>
              <TableCell>{row.이슈유형}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default OrderSummaryTable
