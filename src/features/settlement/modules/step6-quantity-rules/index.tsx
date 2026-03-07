// 옵션/수량 정규화 (Optional)

import FileIcon from '@mui/icons-material/FileCopy'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  cardHeaderClasses,
  styled,
} from '@mui/material'
import { useEffect } from 'react'
import { BasicSizeTypography } from '../../components/StyledComponent'
import useDataStore from '../../store/DataStore'
import useMappingStore from '../../store/MappingStore'
import DataTable from './components/DataTable'
import TabsSqureButtonNoProgress from './components/TabsSqureButtonNoProgress'

const Step6_QuantityRules = () => {
  const { parsedData, selectedDataId } = useDataStore()
  const selectedData = parsedData.find(data => data.id === selectedDataId)
  const {
    step6ActiveFile,
    setStep6ActiveFile,
    resetStep6TemporaryEdits,
    saveStep6QuantityMappings,
  } = useMappingStore()

  const otherFileNames = parsedData
    .filter(data => data.id !== selectedDataId)
    .map(data => data.name)

  useEffect(() => {
    setStep6ActiveFile(otherFileNames[0])
  }, [])

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

        <Box sx={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          {otherFileNames.length > 0 ? (
            otherFileNames.map(fileName => (
              <TabsSqureButtonNoProgress
                key={fileName}
                tabNames={fileName}
                activeTab={step6ActiveFile || ''}
                onClick={file => setStep6ActiveFile(file)}
              />
            ))
          ) : (
            <BasicSizeTypography>비교 파일이 없습니다.</BasicSizeTypography>
          )}
        </Box>
      </Box>
      <CardContent>
        <Card variant="outlined">
          <StyledCardHeader
            title="옵션 수량 정규화 리스트"
            sx={{ padding: '', borderBottom: '1px solid #e0e0e0' }}
          />

          <CardContent>
            <DataTable />
            <Box
              sx={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '12px',
              }}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  if (step6ActiveFile) {
                    resetStep6TemporaryEdits(step6ActiveFile)
                  }
                }}
                color="info"
              >
                초기화
              </Button>
              <Button
                variant="contained"
                color="primary"
                disableElevation
                onClick={() => {
                  if (step6ActiveFile) {
                    saveStep6QuantityMappings(step6ActiveFile)
                    alert('수량 규칙이 적용되었습니다.')
                  }
                }}
              >
                적용하기
              </Button>
            </Box>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

const StyledCardHeader = styled(CardHeader)(() => ({
  [`& .${cardHeaderClasses.title}`]: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
}))

export default Step6_QuantityRules
