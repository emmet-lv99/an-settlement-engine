import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { useState } from 'react'
import LabelMatchContainer from '../../../components/LabelMatchContainer'
import { StyledTableCell } from '../../../components/StyledComponent'
import useMappingStore from '../../../store/MappingStore'
import { sortByKoreanString } from '../../../utils/Utils'

interface Column {
  id: 'base_column_name' | 'comparison_column_name' | 'status'
  label: string
  minWidth?: number
  align?: 'right'
  format?: (value: number) => string
}

const columns: readonly Column[] = [
  { id: 'base_column_name', label: '기준 파일 열', minWidth: 170 },
  { id: 'comparison_column_name', label: '비교 파일 열', minWidth: 100 },
  { id: 'status', label: '상태', minWidth: 100 },
]

const DataTable = () => {
  const {
    step4ActiveTab,
    fileConfigurations,
    temporaryEdits,
    setTemporaryEdits,
  } = useMappingStore()

  const fileConfiguration = fileConfigurations.get(step4ActiveTab || '')
  // 정렬 상태 관리
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  // 정렬 기준 관리
  const [orderBy, setOrderBy] = useState<string>('status')

  // 정렬 핸들러 생성
  const createSortHandler =
    (property: string) => (event: React.MouseEvent<unknown>) => {
      event.preventDefault()
      const isAsc = orderBy === property && order === 'asc'
      setOrder(isAsc ? 'desc' : 'asc')
      setOrderBy(property)
    }

  // Select 닫힐 때 포커스 제거
  const handleSelectClose = () => {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement.blur) {
        activeElement.blur()
      }
    }, 0)
  }

  // 데이터 정렬 함수
  const getSortedData = () => {
    if (!fileConfiguration?.tableData) return []

    const tableData = [...fileConfiguration.tableData]

    return tableData.sort((a, b) => {
      let compareResult = 0

      if (orderBy === 'base_column_name') {
        // 기준 파일 열 이름으로 정렬
        compareResult = a.masterColumnName.localeCompare(b.masterColumnName)
      } else if (orderBy === 'comparison_column_name') {
        // 비교 파일 열 이름으로 정렬
        const aValue =
          temporaryEdits
            .get(step4ActiveTab || '')
            ?.find(item => item.masterColumnName === a.masterColumnName)
            ?.selectedTargetColumn || ''
        const bValue =
          temporaryEdits
            .get(step4ActiveTab || '')
            ?.find(item => item.masterColumnName === b.masterColumnName)
            ?.selectedTargetColumn || ''
        compareResult = aValue.localeCompare(bValue)
      } else if (orderBy === 'status') {
        // 매칭 상태로 정렬
        const aMatched = !!temporaryEdits
          .get(step4ActiveTab || '')
          ?.find(item => item.masterColumnName === a.masterColumnName)
          ?.selectedTargetColumn
        const bMatched = !!temporaryEdits
          .get(step4ActiveTab || '')
          ?.find(item => item.masterColumnName === b.masterColumnName)
          ?.selectedTargetColumn

        compareResult = aMatched === bMatched ? 0 : aMatched ? -1 : 1
      }

      return order === 'asc' ? compareResult : -compareResult
    })
  }

  const sortedData = getSortedData()

  return (
    <TableContainer
      sx={{ maxHeight: 440 }}
      component={Paper}
      elevation={0}
      variant="outlined"
    >
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            {columns.map(column => {
              return (
                <StyledTableCell key={column.id} align={column.align}>
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={createSortHandler(column.id)}
                    key={column.id}
                  >
                    {column.label}
                    {/* {column.label} */}
                    {orderBy === column.id ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === 'desc'
                          ? 'sorted descending'
                          : 'sorted ascending'}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                  {/* {column.label} */}
                </StyledTableCell>
              )
            })}
          </TableRow>
        </TableHead>
        {
          <TableBody>
            {sortedData.map(data => (
              <TableRow hover key={data.masterColumnName} tabIndex={-1}>
                <StyledTableCell>{data.masterColumnName}</StyledTableCell>
                <StyledTableCell>
                  <FormControl>
                    <Select
                      displayEmpty
                      size="small"
                      value={
                        temporaryEdits
                          .get(step4ActiveTab || '')
                          ?.find(
                            item =>
                              item.masterColumnName === data.masterColumnName,
                          )?.selectedTargetColumn || ''
                      }
                      inputProps={{ 'aria-label': 'Without label' }}
                      onClose={handleSelectClose}
                      onChange={e => {
                        setTemporaryEdits(
                          step4ActiveTab || '',
                          data.masterColumnName,
                          e.target.value as string,
                        )
                      }}
                    >
                      {sortByKoreanString(
                        fileConfiguration?.selectOptions || [],
                      ).map((option: string) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                      <MenuItem value="">선택하세요</MenuItem>
                    </Select>
                  </FormControl>
                </StyledTableCell>
                <StyledTableCell>
                  {temporaryEdits
                    .get(step4ActiveTab || '')
                    ?.find(
                      item => item.masterColumnName === data.masterColumnName,
                    )?.selectedTargetColumn ? (
                    <LabelMatchContainer color="#E5F5E6">
                      <CheckIcon sx={{ fontSize: '14px', color: '#2AA900' }} />
                      매칭 완료
                    </LabelMatchContainer>
                  ) : (
                    <LabelMatchContainer color="#FFE5E5">
                      <CloseIcon sx={{ fontSize: '14px', color: '#FF0004' }} />
                      미매칭
                    </LabelMatchContainer>
                  )}
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        }
      </Table>
    </TableContainer>
  )
}

export default DataTable

// const StyledTableCell = styled(TableCell)(() => ({
//   [`&.${tableCellClasses.head}`]: {
//     backgroundColor: '#FAFAFA',
//     color: '#404040',
//     fontSize: 12,
//     fontWeight: 'bold',
//     height: '40px',
//     paddingBottom: '0',
//     paddingTop: '0',
//   },
//   [`&.${tableCellClasses.body}`]: {
//     fontSize: 14,
//   },
// }))
