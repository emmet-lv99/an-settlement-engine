import { Box } from '@mui/material'
import { useEffect } from 'react'
import TabsRoundButton from '../../../components/TabsRoundButton'
import useMappingStore from '../../../store/MappingStore'

const TabsColumns = () => {
  const {
    step5ActiveFile,
    fileConfigurations,
    setStep5ActiveColumn,
    step5ActiveColumn,
    masterKeyColumnName,
    masterQuantityColumnName,
  } = useMappingStore()

  useEffect(() => {
    // 파일이 선택되고 컬럼 매핑이 있을 때 첫 번째 컬럼을 선택
    if (
      step5ActiveFile &&
      fileConfigurations.get(step5ActiveFile)?.columnMappings &&
      Object.keys(fileConfigurations.get(step5ActiveFile)?.columnMappings || {})
        .length > 0 &&
      !step5ActiveColumn.has(step5ActiveFile || '')
    ) {
      setStep5ActiveColumn(
        step5ActiveFile || '',
        Object.keys(
          fileConfigurations.get(step5ActiveFile)?.columnMappings || {},
        )[0],
      )
    }
  }, [
    step5ActiveFile,
    fileConfigurations,
    setStep5ActiveColumn,
    step5ActiveColumn,
  ])

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '12px',
        marginTop: '12px',
        width: 'fit-content', // 컨텐츠에 맞는 자연스러운 너비
        maxWidth: '100%', // 부모를 넘지 않도록 제한
        whiteSpace: 'wrap', // 줄바꿈 방지
        flexWrap: 'wrap',
      }}
    >
      {step5ActiveColumn &&
        step5ActiveFile &&
        Object.keys(
          fileConfigurations.get(step5ActiveFile)?.columnMappings || {},
        )
          .filter(
            column =>
              column !== masterKeyColumnName &&
              column !== masterQuantityColumnName,
          ) // masterKeyColumnName 과 masterQuantityColumnName 제외
          .map(column => (
            <TabsRoundButton
              key={`${step5ActiveFile || ''}-${column || ''}`}
              file={step5ActiveFile || ''}
              columnName={column}
              activeTab={step5ActiveColumn.get(step5ActiveFile || '') || ''}
              matchPercentage={
                fileConfigurations
                  .get(step5ActiveFile || '')
                  ?.valueMatchProgress?.progressByColumn?.get(column) || 0
              }
              onClick={setStep5ActiveColumn}
            />
          ))}
    </Box>
  )
}

export default TabsColumns
