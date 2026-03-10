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
    parsedData,
    setCurrentStep,
    parseSelectedSheets,
  } = useDataStore()

  
  const handleNext = async () => {
    if (currentStep === 1) {
      try {
        await parseSelectedSheets()
      } catch (error) {
        alert('파싱 중 오류가 발생했습니다.')
        console.error(error)
        return
      }
    }
    if (currentStep === steps.length - 1) {
      alert('마지막 단계입니다.')
      throw new Error('마지막 단계입니다.')
    }

    setCurrentStep(currentStep + 1)
  }

  const checkStep3Duplicate = () => {
    for (let i = 0; i < parsedData.length; i++) {
      const seen = new Set();
      const hasDuplicates = parsedData[i].data.some(
        row => {
          const trackingNo = row['송장번호(대한통운)'];
          if(!trackingNo) return false;
          if(seen.has(trackingNo)) return true;
          seen.add(trackingNo);
          return false
        }
      )
      if(hasDuplicates) return true
    } 
    return false
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
              (currentStep === 1 && selectedSheetNames.length === 0) ||
              (currentStep === 2 && checkStep3Duplicate() )
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
