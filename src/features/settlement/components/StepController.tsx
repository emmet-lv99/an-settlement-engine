import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import { Box, Button } from '@mui/material'
import useDataStore from '../store/DataStore'
import useMappingStore from '../store/MappingStore'

interface HandleStepProps {
  steps: string[]
}

const StepController = (props: HandleStepProps) => {
  const { steps } = props

  const {
    parsedData,
    selectedDataId,
    files,
    currentStep,
    setCurrentStep,
    skippedSteps,
    setSkippedSteps,
    optionalSteps,
    setComparisonResult,
    setIsComparisonLoading,
  } = useDataStore()

  const {
    fileConfigurations,
    masterKeyColumnName,
    masterQuantityColumnName,
    selectedComparisonTargetColumns,
    setStep7ComparisonGroups,
  } = useMappingStore()

  const isStepSkipped = (step: number) => {
    return skippedSteps.has(step)
  }

  const handleNext = () => {
    let newSkipped = skippedSteps
    if (isStepSkipped(currentStep)) {
      newSkipped = new Set(newSkipped.values())
      newSkipped.delete(currentStep)
    }

    if (currentStep === steps.length - 1) {
      alert('마지막 단계입니다.')
      throw new Error('마지막 단계입니다.')
    }

    setCurrentStep(currentStep + 1)
    setSkippedSteps(newSkipped)
  }

  const handleBack = () => {
    // Step 0에서는 돌아갈 수 없음
    if (currentStep === 0) {
      alert('첫 번째 단계입니다.')
      return
    }

    // Step 7에서 돌아갈 때 비교 결과 및 그룹 데이터 초기화
    if (currentStep === 6) {
      setComparisonResult(null)
      setIsComparisonLoading(false)
      setStep7ComparisonGroups(new Map())
    }

    // 이전 단계로 이동
    setCurrentStep(currentStep - 1)
  }

  const handleSkip = () => {
    // 선택사항이 아닌 경우 예외 처리
    if (!optionalSteps.has(currentStep)) {
      alert('선택사항이 아닌 단계입니다.')
      throw new Error('선택사항이 아닌 단계입니다.')
    }

    setCurrentStep(currentStep + 1)
    setSkippedSteps(new Set(skippedSteps.values()).add(currentStep))
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {currentStep === 0 && <div></div>}
      {currentStep !== 0 && (
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 1 }}
        >
          이전단계
        </Button>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {currentStep !== steps.length - 1 &&
          (() => {
            const disabledValue =
              (currentStep === 0 && files === null) ||
              (currentStep === 0 && files?.length === 0) ||
              (currentStep === 2 &&
                selectedComparisonTargetColumns.length === 0) ||
              (currentStep === 3 &&
                !Array.from(fileConfigurations.values())
                  .filter(
                    config =>
                      config.fileName !==
                      parsedData.find(data => data.id === selectedDataId)?.name,
                  )
                  .every(config => config.matchedStatus === true)) ||
              (currentStep === 4 &&
                !Array.from(fileConfigurations.values())
                  .filter(
                    config =>
                      config.fileName !==
                      parsedData.find(data => data.id === selectedDataId)?.name,
                  )
                  .every(
                    config =>
                      config.valueMappings.size > 0 &&
                      Object.keys(config.columnMappings)
                        .filter(
                          columnName =>
                            columnName !== masterKeyColumnName &&
                            columnName !== masterQuantityColumnName,
                        ) // masterKeyColumnName 제외
                        .every(columnName =>
                          config.valueMappings.has(columnName),
                        ),
                  ))

            return (
              <Button disabled={disabledValue} onClick={handleNext}>
                다음
                <ArrowForwardIcon />
              </Button>
            )
          })()}
        {optionalSteps.has(currentStep) && (
          <Button onClick={handleSkip}>
            건너뛰기
            <SkipNextIcon />
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default StepController
