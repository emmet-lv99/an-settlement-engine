import { Box } from '@mui/material'
import TabsSquareButton from '../../../components/TabsSqureButton'
import useMappingStore from '../../../store/MappingStore'

interface TabsProps {
  fileNames: string[]
}

const Tabs = ({ fileNames }: TabsProps) => {
  const {
    setStep4ActiveTab,
    step4ActiveTab,
    fileConfigurations,
    temporaryEdits,
  } = useMappingStore()

  // 매칭 상태를 계산하는 함수
  const getMatchStatus = (fileName: string) => {
    // 전체 항목 수
    const totalCount = fileConfigurations.get(fileName)?.tableData.length || 0

    // 선택된 항목 수 (null이 아닌 것만)
    const selectedCount =
      temporaryEdits
        .get(fileName)
        ?.filter(
          item =>
            item.selectedTargetColumn !== null &&
            item.selectedTargetColumn !== '',
        ).length || 0

    return Math.round((selectedCount / totalCount) * 100)
  }

  return (
    <Box sx={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
      {fileNames.map(fileName => {
        const matchStatus = getMatchStatus(fileName)

        return (
          <TabsSquareButton
            key={fileName}
            fileName={fileName}
            activeTab={step4ActiveTab || ''}
            matchPercentage={matchStatus}
            onClick={setStep4ActiveTab}
          />
        )
      })}
    </Box>
  )
}

export default Tabs
