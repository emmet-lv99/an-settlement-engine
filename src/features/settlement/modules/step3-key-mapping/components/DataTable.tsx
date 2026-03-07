import {
  Checkbox,
  Paper,
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
  id: 'column_name' | 'data_sample'
  label: string
  minWidth?: number
  align?: 'right'
  format?: (value: number) => string
}

const columns: readonly Column[] = [
  { id: 'column_name', label: '열 이름', minWidth: 170 },
  { id: 'data_sample', label: '데이터 샘플', minWidth: 100 },
]

const DataTable = () => {
  const { selectedDataId, parsedData } = useDataStore()

  const {
    masterKeyColumnName,
    masterQuantityColumnName,
    selectedComparisonTargetColumns,
    handleRowClick,
    handleRowClickAll,
  } = useMappingStore()

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

  // Object.entries()를 사용하여 [key, value] 쌍의 배열로 변환
  const rows = firstData
    ? sortByKoreanObjectKey(
        Object.entries(firstData).map(([key, value], index) => ({
          id: index,
          column_name: key,
          data_sample: value as string,
        })),
        'column_name',
      )
    : []

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
                  <StyledTableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={
                        selectedComparisonTargetColumns.length === rows.length
                      }
                      onChange={() => handleRowClickAll(rows)}
                    />
                  </StyledTableCell>
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
                  {rows &&
                    rows.map(row => {
                      const isSelected = selectedComparisonTargetColumns.some(
                        r => r.id === row.id,
                      )
                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={row.column_name}
                          onClick={() => {
                            // masterKeyColumnName 과 masterQuantityColumnName 은 선택할 수 없다.
                            if (masterKeyColumnName === row.column_name) return
                            if (masterQuantityColumnName === row.column_name)
                              return
                            handleRowClick({
                              id: row.id,
                              column_name: row.column_name,
                            })
                          }}
                        >
                          <StyledTableCell padding="checkbox">
                            <Checkbox
                              disabled={
                                masterKeyColumnName === row.column_name ||
                                masterQuantityColumnName === row.column_name
                              }
                              color="primary"
                              checked={isSelected}
                            />
                          </StyledTableCell>

                          {columns.map(column => {
                            const value = row[column.id]
                            return (
                              <StyledTableCell
                                key={column.id}
                                align={column.align}
                              >
                                {column.format && typeof value === 'number'
                                  ? column.format(value)
                                  : value}
                              </StyledTableCell>
                            )
                          })}
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

export default DataTable
