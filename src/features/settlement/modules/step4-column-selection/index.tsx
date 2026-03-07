// 비교 항목 선택

import FileIcon from '@mui/icons-material/FileCopy'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  cardHeaderClasses,
  FormControl,
  MenuItem,
  Select,
  styled,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useEffect, useState } from 'react'
import { BasicSizeTypography } from '../../components/StyledComponent'
import useDataStore from '../../store/DataStore'
import useMappingStore from '../../store/MappingStore'
import DataTable from './components/DataTable'
import Tabs from './components/Tabs'

const Step4_ColumnSelection = () => {
  const {
    selectedComparisonTargetColumns,
    setFileConfigurations,
    fileConfigurations,
    setStep4ActiveTab,
    step4ActiveTab,
    temporaryEdits,
    setBaseQuantityColumn,
  } = useMappingStore()

  // 실제 수량 컬럼 임시 저장 상태 (파일별로 관리)
  const [tempBaseQuantityColumns, setTempBaseQuantityColumns] = useState<
    Map<string, string | null>
  >(new Map())

  const { parsedData, selectedDataId } = useDataStore()
  const { masterKeyColumnName, masterQuantityColumnName } = useMappingStore()

  // 기준 파일 명 불러오기
  const selectedData = parsedData.find(data => data.id === selectedDataId)

  // 현재 활성 파일의 컬럼 목록 가져오기
  const currentFileConfig = fileConfigurations.get(step4ActiveTab || '')
  const availableColumns = currentFileConfig?.selectOptions || []

  // 현재 파일의 임시 저장된 실제 수량 컬럼 가져오기
  const currentBaseQuantityColumn =
    tempBaseQuantityColumns.get(step4ActiveTab || '') || ''

  // 실제 수량 컬럼 변경 핸들러
  const handleBaseQuantityColumnChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string
    const fileName = step4ActiveTab || ''

    console.log(
      `📝 [임시 저장] ${fileName} → 실제 수량 컬럼: ${value || '없음'}`,
    )

    setTempBaseQuantityColumns(prev => {
      const updated = new Map(prev)
      updated.set(fileName, value || null)
      return updated
    })
  }

  // 기준 파일을 제외 한 나머지 파일 이름을 받아서 탭 버튼 반복시킨다.
  const otherFileNames = parsedData
    .filter(data => data.id !== selectedDataId)
    .map(data => data.name)

  // 3단계에서 선택한 컬럼 데이터를 fileConfigurations에 세팅
  useEffect(() => {
    setStep4ActiveTab(otherFileNames[0])

    const columnNames = [
      ...selectedComparisonTargetColumns,
      {
        id: selectedComparisonTargetColumns.length + 1,
        column_name: masterKeyColumnName,
      },
      {
        id: selectedComparisonTargetColumns.length + 2,
        column_name: masterQuantityColumnName,
      },
    ]

    // 3단계에서 선택한 컬럼 데이터를 tableData에 세팅
    const tableData =
      columnNames.map(col => ({
        masterColumnName: col.column_name, // 컬럼명 저장
        selectedTargetColumn: null,
        isMatched: false,
      })) || []

    if (columnNames.length > 0) {
      // 불변성을 지키면서 새로운 Map과 객체 생성
      const updatedConfigs = new Map()

      fileConfigurations.forEach((config, fileName) => {
        // 기준 파일인 경우: 자동으로 1:1 매핑 생성
        if (fileName === selectedData?.name) {
          const autoColumnMappings = columnNames.reduce<Record<string, string>>(
            (acc, col) => {
              if (col.column_name) {
                acc[String(col.column_name)] = col.column_name
              }
              return acc
            },
            {},
          )

          const autoTableData = columnNames.map(col => ({
            masterColumnName: col.column_name,
            selectedTargetColumn: col.column_name, // 1:1 매핑
            isMatched: true,
          }))

          updatedConfigs.set(fileName, {
            ...config,
            tableData: autoTableData,
            columnMappings: autoColumnMappings,
            matchedStatus: true, // 자동 매핑 완료
          })
        }
        // 비교 파일인 경우: 기존 로직 유지
        else {
          updatedConfigs.set(fileName, {
            ...config,
            tableData,
          })
        }
      })

      // Store에 업데이트된 설정 저장
      setFileConfigurations(updatedConfigs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComparisonTargetColumns])

  // Store에서 저장된 baseQuantityColumn 불러와서 tempBaseQuantityColumns 초기화
  useEffect(() => {
    const restoredMap = new Map<string, string | null>()

    fileConfigurations.forEach((config, fileName) => {
      // 기준 파일은 제외
      if (fileName !== selectedData?.name) {
        // Store에 저장된 baseQuantityColumn이 있으면 복원
        if (config.baseQuantityColumn !== undefined) {
          restoredMap.set(fileName, config.baseQuantityColumn)
          console.log(
            `✅ [복원] ${fileName} → 실제 수량 컬럼: ${config.baseQuantityColumn || '선택 안 함'}`,
          )
        }
      }
    })

    // 복원된 데이터가 있으면 tempBaseQuantityColumns 업데이트
    if (restoredMap.size > 0) {
      setTempBaseQuantityColumns(restoredMap)
      console.log(
        `📦 [Step 4] ${restoredMap.size}개 파일의 실제 수량 컬럼 복원 완료`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 다음 파일로 이동하는 함수
  const handleNextFile = () => {
    const currentIndex = otherFileNames.indexOf(step4ActiveTab || '')
    if (currentIndex < otherFileNames.length - 1) {
      setStep4ActiveTab(otherFileNames[currentIndex + 1])
    } else {
      alert('마지막 파일입니다.')
      throw new Error('마지막 파일입니다.')
    }
  }

  const handleSave = () => {
    const currentFileName = step4ActiveTab || ''
    const currentFileConfiguration = fileConfigurations.get(currentFileName)

    if (currentFileConfiguration) {
      // columnMappings 생성
      const columnMappings =
        temporaryEdits.get(currentFileName)?.reduce(
          (acc, item) => ({
            ...acc,
            [item.masterColumnName]: item.selectedTargetColumn,
          }),
          {},
        ) || ({} as { [masterColumn: string]: string | null })

      // 불변성을 지키면서 새로운 객체 생성
      const updatedConfig = {
        ...currentFileConfiguration,
        matchedStatus: true,
        columnMappings,
        tableData:
          temporaryEdits.get(currentFileName)?.map(item => ({
            masterColumnName: item.masterColumnName,
            selectedTargetColumn: item.selectedTargetColumn,
            isMatched: true,
          })) || [],
      }

      // 새로운 Map 생성하여 업데이트
      const updatedConfigs = new Map(fileConfigurations)
      updatedConfigs.set(currentFileName, updatedConfig)
      setFileConfigurations(updatedConfigs)

      // 실제 수량 컬럼 저장
      const baseQuantityColumn = tempBaseQuantityColumns.get(currentFileName)
      setBaseQuantityColumn(currentFileName, baseQuantityColumn || null)
    }

    alert('저장되었습니다.')
  }

  // 저장 버튼 활성화 여부 확인
  const isSaveButtonEnabled = () => {
    // 현재 파일의 매칭 값이 모두 선택되면 저장 버튼 활성화
    // 현재 테이블의 행의 수와 임시 저장된 매칭 값의 수가 같으면 저장 버튼 활성화
    const currentFileName = step4ActiveTab || ''
    const currentFileConfiguration = fileConfigurations.get(currentFileName)
    if (currentFileConfiguration) {
      return (
        currentFileConfiguration.tableData.length ===
        temporaryEdits
          .get(currentFileName)
          ?.filter(
            item =>
              item.selectedTargetColumn !== null &&
              item.selectedTargetColumn !== '',
          ).length
      )
    }
    return false
  }

  return (
    <Card variant="outlined">
      <Box sx={{ padding: '16px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FileIcon
            sx={{ fontSize: '16px', color: '#404040', marginRight: '4px' }}
          />
          <BasicSizeTypography>기준파일:</BasicSizeTypography>
          <BasicSizeTypography
            sx={{ color: '#1876D1', fontWeight: 'bold', marginLeft: '4px' }}
          >
            {selectedData?.name}
          </BasicSizeTypography>
        </Box>
        {otherFileNames.length > 0 ? (
          <Tabs fileNames={otherFileNames} />
        ) : (
          <BasicSizeTypography>비교 파일이 없습니다.</BasicSizeTypography>
        )}
      </Box>
      <CardContent>
        <Card variant="outlined">
          <StyledCardHeader
            title="기준 파일의 열을 비교 파일의 열과 매칭하세요"
            sx={{ padding: '', borderBottom: '1px solid #e0e0e0' }}
          />

          <CardContent>
            <DataTable />

            {/* 실제 수량 컬럼 선택 */}
            <Box
              sx={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#404040',
                }}
              >
                [{step4ActiveTab}] 실제 수량 컬럼 지정 (선택사항)
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  marginBottom: '12px',
                  color: '#666',
                }}
              >
                주문수량 컬럼이 텍스트로 매핑된 경우, 실제 수량 값을 가져올 원본
                컬럼을 지정하세요.
              </Typography>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <Select
                  value={currentBaseQuantityColumn}
                  onChange={handleBaseQuantityColumnChange}
                  displayEmpty
                  sx={{
                    backgroundColor: 'white',
                  }}
                >
                  <MenuItem value="">
                    <em>선택 안 함</em>
                  </MenuItem>
                  {availableColumns.map(column => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '12px',
              }}
            >
              <Button variant="outlined" onClick={handleNextFile} color="info">
                다음 파일로 이동
              </Button>
              <Button
                variant="contained"
                disabled={!isSaveButtonEnabled()}
                onClick={handleSave}
                color="primary"
                disableElevation
              >
                저장
              </Button>
            </Box>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

export default Step4_ColumnSelection

const StyledCardHeader = styled(CardHeader)(() => ({
  [`& .${cardHeaderClasses.title}`]: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
}))
