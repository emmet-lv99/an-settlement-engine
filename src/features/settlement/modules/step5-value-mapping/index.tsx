// 항목 값 매칭
import FileIcon from '@mui/icons-material/FileCopy'
import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { useEffect } from 'react'
import { BasicSizeTypography } from '../../components/StyledComponent'
import useDataStore from '../../store/DataStore'
import useMappingStore from '../../store/MappingStore'
import DataTable from './components/DataTable'
import TabsColumns from './components/TabsColumns'
import Tabs from './components/TabsFiles'
// TODO: EMPTY 컬럼 버그 픽스
const Step5_ValueMapping = () => {
  const { parsedData, selectedDataId } = useDataStore()
  const {
    step5ActiveFile,
    step5ActiveColumn,
    setStep5ActiveFile,
    fileConfigurations,
    step5TemporaryEdits,
    saveStep5ValueMappings,
  } = useMappingStore()

  const selectedData = parsedData.find(data => data.id === selectedDataId)

  const otherFileNames = parsedData
    .filter(data => data.id !== selectedDataId)
    .map(data => data.name)

  useEffect(() => {
    setStep5ActiveFile(otherFileNames[0])
  }, [])

  const handleNextFile = () => {
    const currentIndex = otherFileNames.indexOf(step5ActiveFile || '')
    if (currentIndex < otherFileNames.length - 1) {
      setStep5ActiveFile(otherFileNames[currentIndex + 1])
    } else {
      alert('마지막 파일입니다.')
      throw new Error('마지막 파일입니다.')
    }
  }

  const isSaveButtonEnabled = () => {
    return (
      fileConfigurations.get(step5ActiveFile || '')?.valueMatchProgress
        ?.overallProgress === 100
    )
  }

  const handleSave = () => {
    if (!step5ActiveFile) return

    const fileEdits = step5TemporaryEdits.get(step5ActiveFile)
    if (!fileEdits) {
      alert('저장할 매핑 데이터가 없습니다.')
      return
    }

    console.log('💾 [Step5] 값 매핑 저장 시작')
    console.log(`  - 파일명: ${step5ActiveFile}`)
    console.log(`  - 임시 편집 데이터:`, fileEdits)

    // 임시 편집 데이터를 읽기 쉬운 형태로 출력
    fileEdits.forEach((mappings, columnName) => {
      console.log(`  - [${columnName}] 컬럼의 값 매핑:`)
      mappings.forEach(({ comparisonValue, masterValue }) => {
        if (masterValue) {
          console.log(`    "${comparisonValue}" → "${masterValue}"`)
        }
      })
    })

    saveStep5ValueMappings(step5ActiveFile, fileEdits)

    console.log(`✅ [Step5] 저장 완료`)

    alert(`${step5ActiveFile} 파일의 값 매핑이 저장되었습니다.`)
  }

  return (
    <Card variant="outlined">
      <Box sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
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
      <Box sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <BasicSizeTypography>매핑할 열:</BasicSizeTypography>
        <TabsColumns />
      </Box>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: '18px', marginBottom: '12px' }}
          >
            [{step5ActiveFile}] / [
            {step5ActiveColumn.get(step5ActiveFile || '')}] 열 값 매핑
          </Typography>
        </Box>
        <DataTable />
        <Box
          sx={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '12px',
          }}
        >
          <Button variant="outlined" color="info" onClick={handleNextFile}>
            다음 파일로 이동
          </Button>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            disabled={!isSaveButtonEnabled()}
            onClick={handleSave}
          >
            저장
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default Step5_ValueMapping
