import {
  Box,
  FormControl,
  Input,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { useEffect, useState } from 'react'
import { StyledTableCell } from '../../../components/StyledComponent'
import useDataStore from '../../../store/DataStore'
import useMappingStore from '../../../store/MappingStore'
import { sortByKoreanStringDesc } from '../../../utils/Utils'

interface Column {
  id: 'target_column_name' | 'quantity_rule'
  label: string
  minWidth?: number
  align?: 'right'
  format?: (value: number) => string
}

const columns: readonly Column[] = [
  { id: 'target_column_name', label: '보정 값', minWidth: 170 },
  { id: 'quantity_rule', label: '보정 수량', minWidth: 100 },
]

const DataTable = () => {
  const { parsedData } = useDataStore()
  const {
    step6ActiveFile,
    fileConfigurations,
    masterQuantityColumnName,
    step6TemporaryEdits,
    setStep6TemporaryEdits,
  } = useMappingStore()

  // 파일 설정 가져오기
  const fileConfiguration = fileConfigurations.get(step6ActiveFile || '')

  // 수량 컬럼 이름 가져오기
  const quantityColumn =
    fileConfiguration?.columnMappings[masterQuantityColumnName || '']

  // 수량 컬럼 데이터 가져오기
  const quantityColumnData = parsedData
    .find(data => data.name === step6ActiveFile)
    ?.data.map(item => item[quantityColumn || ''] as string)

  // 중복 제거 및 한글 내림차순 정렬 (문자열로 변환 + 공백 제거)
  const uniqueQuantityColumnData = sortByKoreanStringDesc([
    ...new Set(
      quantityColumnData
        ?.filter(Boolean)
        .map(item => String(item).trim()) // 문자열로 변환하고 앞뒤 공백 제거
    ),
  ])

  // 현재 파일의 임시 편집 데이터 가져오기
  const currentFileEdits = step6TemporaryEdits.get(step6ActiveFile || '')

  // 수량 컬럼 데이터를 테이블 데이터로 변환 (임시 편집 데이터 반영)
  const tableData = uniqueQuantityColumnData.map(item => {
    return {
      target_column_name: item,
      quantity_rule: currentFileEdits?.get(item) || '',
    }
  })

  // 정렬 상태 관리 (초기값: 한글 내림차순)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  // 정렬 기준 관리
  const [orderBy, setOrderBy] = useState<string>('target_column_name')

  // 정렬 핸들러 생성
  const createSortHandler =
    (property: string) => (event: React.MouseEvent<unknown>) => {
      event.preventDefault()
      const isAsc = orderBy === property && order === 'asc'
      setOrder(isAsc ? 'desc' : 'asc')
      setOrderBy(property)
    }

  // 초기값을 '1'로 설정 (이미 값이 있으면 건드리지 않음)
  useEffect(() => {
    if (step6ActiveFile && uniqueQuantityColumnData.length > 0) {
      uniqueQuantityColumnData.forEach(item => {
        // 이미 값이 있으면 초기화하지 않음
        if (!currentFileEdits?.has(item)) {
          setStep6TemporaryEdits(step6ActiveFile, item, '1')
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step6ActiveFile])

  // 데이터 정렬 함수 (한글 정렬 지원)
  const getSortedData = () => {
    if (!tableData) return []

    return tableData.sort((a, b) => {
      let compareResult = 0

      if (orderBy === 'target_column_name') {
        // 한글 정렬 (localeCompare 사용)
        compareResult = a.target_column_name.localeCompare(
          b.target_column_name,
          'ko-KR',
        )
      } else if (orderBy === 'quantity_rule') {
        // 수량 규칙으로 정렬 (숫자)
        const aValue =
          tableData.find(
            item => item.target_column_name === a.target_column_name,
          )?.quantity_rule || ''
        const bValue =
          tableData.find(
            item => item.target_column_name === b.target_column_name,
          )?.quantity_rule || ''

        // 숫자로 변환하여 비교
        const aNum = Number(aValue)
        const bNum = Number(bValue)

        if (!isNaN(aNum) && !isNaN(bNum)) {
          compareResult = aNum - bNum
        } else {
          // 숫자가 아닌 경우 문자열로 비교
          compareResult = aValue.localeCompare(bValue, 'ko-KR')
        }
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
              <TableRow
                hover
                key={`${step6ActiveFile || ''}-${data.target_column_name}`}
                tabIndex={-1}
              >
                <StyledTableCell>{data.target_column_name}</StyledTableCell>
                <StyledTableCell>
                  <FormControl>
                    <Input
                      type="number"
                      value={data.quantity_rule}
                      onChange={e => {
                        setStep6TemporaryEdits(
                          step6ActiveFile || '',
                          data.target_column_name,
                          e.target.value,
                        )
                      }}
                    />
                  </FormControl>
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
