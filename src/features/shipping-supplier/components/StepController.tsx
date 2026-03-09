import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Button } from '@mui/material'
import useDataStore from '../store/DataStore'

interface HandleStepProps {
  steps: string[]
}

const StepController = (props: HandleStepProps) => {
  const { steps } = props

  const {
    files,
    currentStep,
    selectedSheetNames,
    setCurrentStep,
  } = useDataStore()

  
  const handleNext = () => {

    if (currentStep === steps.length - 1) {
      alert('마지막 단계입니다.')
      throw new Error('마지막 단계입니다.')
    }

    setCurrentStep(currentStep + 1)
  }


  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {currentStep === 0 && <div></div>}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {currentStep !== steps.length - 1 &&
          (() => {
            const disabledValue =
              (currentStep === 0 && files === null) ||
              (currentStep === 0 && files?.length === 0) ||
              (currentStep === 1 && selectedSheetNames.length === 0)

            return (
              <Button disabled={disabledValue} onClick={handleNext}>
                다음
                <ArrowForwardIcon />
              </Button>
            )
          })()}
      </Box>
    </Box>
  )
}

export default StepController
