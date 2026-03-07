import { Box, Button } from '@mui/material'
import { BasicSizeTypography } from '../../../components/StyledComponent'
import useMappingStore from '../../../store/MappingStore'

interface ModeSelectorProps {
  setCurrentView: (
    view: 'MODE_SELECTOR' | 'FILE_MERGE' | 'FILE_COMPARISON',
  ) => void
}

const ModeSelector = ({ setCurrentView }: ModeSelectorProps) => {
  const { setStep7ComparisonMode } = useMappingStore()

  const handleBasicMode = () => {
    setStep7ComparisonMode('BASIC')
    setCurrentView('FILE_COMPARISON')
  }

  const handleAdvancedMode = () => {
    setStep7ComparisonMode('ADVANCED')
    setCurrentView('FILE_MERGE')
  }

  return (
    <>
      <BasicSizeTypography
        sx={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}
      >
        비교 방식 선택
      </BasicSizeTypography>
      <Box sx={{ display: 'flex', gap: '12px' }}>
        <Button
          variant="contained"
          size="large"
          disableElevation
          color="primary"
          sx={{ width: '50%' }}
          onClick={handleBasicMode}
        >
          기본모드(즉시 실행)
        </Button>
        <Button
          variant="outlined"
          size="large"
          disableElevation
          color="primary"
          sx={{ width: '50%' }}
          onClick={handleAdvancedMode}
        >
          고급모드(파일 병합)
        </Button>
      </Box>
    </>
  )
}

export default ModeSelector
