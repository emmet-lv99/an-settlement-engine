import { Box } from '@mui/material'
import TabsSquareButton from '../../../components/TabsSqureButton'
import useMappingStore from '../../../store/MappingStore'

interface TabsProps {
  fileNames: string[]
}

const Tabs = ({ fileNames }: TabsProps) => {
  const { setStep5ActiveFile, step5ActiveFile, fileConfigurations } =
    useMappingStore()

  return (
    <Box sx={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
      {fileNames.map(fileName => {
        return (
          <TabsSquareButton
            key={fileName}
            fileName={fileName}
            activeTab={step5ActiveFile || ''}
            matchPercentage={
              fileConfigurations.get(fileName || '')?.valueMatchProgress
                ?.overallProgress || 0
            }
            onClick={setStep5ActiveFile}
          />
        )
      })}
    </Box>
  )
}

export default Tabs
