/**
 * ============================================
 * StatisticsTable.tsx - 통계 요약 테이블
 * ============================================
 *
 * 전체 통계를 요약하는 테이블입니다.
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
import type { StatisticsRow } from '../../types/ComparisonTypes'

interface StatisticsTableProps {
  data: StatisticsRow[]
}

const StatisticsTable = ({ data }: StatisticsTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>구분</TableCell>
            <TableCell align="right">전체</TableCell>
            <TableCell align="right">완전일치</TableCell>
            <TableCell align="right">부분일치</TableCell>
            <TableCell align="right">불일치</TableCell>
            <TableCell align="right">일치율</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell sx={{ fontWeight: 'bold' }}>{row.구분}</TableCell>
              <TableCell align="right">{row.전체}</TableCell>
              <TableCell align="right">{row.완전일치}</TableCell>
              <TableCell align="right">{row.부분일치}</TableCell>
              <TableCell align="right">{row.불일치}</TableCell>
              <TableCell align="right">{row.일치율}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default StatisticsTable
