import {
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { StyledTableCell } from '../../../components/StyledComponent'
import useDataStore from '../../../store/DataStore'
import useMappingStore from '../../../store/MappingStore'
import { sortByKoreanObjectKey } from '../../../utils/Utils'

interface Column {
  id: 'key_column_name' | 'key_data'
  label: string
  minWidth?: number
  align?: 'right'
  format?: (value: number) => string
}

const columns: readonly Column[] = [
  { id: 'key_column_name', label: '키 컬럼 이름', minWidth: 170 },
  { id: 'key_data', label: '키 데이터 선택', minWidth: 100 },
]

const KeyColumnTable = () => {
  const { selectedDataId, parsedData } = useDataStore()

  const {
    masterKeyColumnName,
    masterQuantityColumnName,
    setMasterKeyColumnName,
    setMasterQuantityColumnName,
  } = useMappingStore()

  const keyColumnList = ['주문번호 정보 열', '주문수량 정보 열']

  // 선택된 데이터 찾기
  const selectedData = parsedData.find(data => data.id === selectedDataId)

  const hasValidData =
    selectedData &&
    selectedData.data &&
    selectedData.data.length > 0 &&
    selectedData.data[0] &&
    Object.keys(selectedData.data[0]).length > 0

  // 첫 번째 데이터 객체를 키-값 쌍의 배열로 변환
  const firstData = hasValidData ? selectedData?.data[0] : null

  const rows = firstData
    ? sortByKoreanObjectKey(
        Object.entries(firstData).map(([key], index) => ({
          id: index,
          key_column_name: key,
        })),
        'key_column_name',
      )
    : []

  const selectedKeyColumnValue = (keyColumn: string) => {
    switch (keyColumn) {
      case '주문번호 정보 열':
        return masterKeyColumnName || ''
      case '주문수량 정보 열':
        return masterQuantityColumnName || ''
      default:
        return ''
    }
  }

  const setSelectedKeyColumnValue = (keyColumn: string, value: string) => {
    switch (keyColumn) {
      case '주문번호 정보 열':
        setMasterKeyColumnName(value)
        break
      case '주문수량 정보 열':
        setMasterQuantityColumnName(value)
        break
      default:
        return ''
    }
  }

  return (
    <>
      {selectedDataId && (
        <Paper elevation={0}>
          <TableContainer
            sx={{ maxHeight: 440 }}
            component={Paper}
            elevation={0}
            variant="outlined"
          >
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map(column => (
                    <StyledTableCell
                      key={column.id}
                      align={column.align}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.label}
                    </StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              {hasValidData ? (
                <TableBody>
                  {keyColumnList.map(keyColumn => {
                    return (
                      <TableRow hover tabIndex={-1} key={keyColumn}>
                        <StyledTableCell key={`${keyColumn}-label`}>
                          {keyColumn}
                        </StyledTableCell>
                        <StyledTableCell key={`${keyColumn}-select`}>
                          <FormControl>
                            <Select
                              size="small"
                              value={selectedKeyColumnValue(keyColumn)}
                              onChange={event => {
                                setSelectedKeyColumnValue(
                                  keyColumn,
                                  event.target.value,
                                )
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">선택하세요</MenuItem>
                              {rows &&
                                rows.map(row => (
                                  <MenuItem
                                    key={row.id}
                                    value={row.key_column_name}
                                  >
                                    {row.key_column_name}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </StyledTableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={columns.length + 1}>
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  )
}

export default KeyColumnTable
