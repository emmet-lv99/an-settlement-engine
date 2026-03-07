import { Box } from '@mui/material'
import Step1_FileUpload from '../modules/step1-file-upload'
import Step2_SourceSelection from '../modules/step2-source-selection'
import Step3_KeyMapping from '../modules/step3-key-mapping'
import Step4_ColumnSelection from '../modules/step4-column-selection'
import Step5_ValueMapping from '../modules/step5-value-mapping'
import Step6_QuantityRules from '../modules/step6-quantity-rules'
import Step7_ResultsDashboard from '../modules/step7-results-dashboard'
import useDataStore from '../store/DataStore'
import StepController from './StepController'
import StepperComponent from './Stepper'

const steps = [
  '파일 업로드',
  '기준 데이터 선택',
  '열 매핑',
  '비교 항목 선택',
  '항목 값 매핑',
  '옵션/수량 정규화',
  '비교 결과 도출',
]

const WizardContainer = () => {
  const { currentStep } = useDataStore()

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <StepperComponent />
      {currentStep === 0 && <Step1_FileUpload />}
      {currentStep === 1 && <Step2_SourceSelection />}
      {currentStep === 2 && <Step3_KeyMapping />}
      {currentStep === 3 && <Step4_ColumnSelection />}
      {currentStep === 4 && <Step5_ValueMapping />}
      {currentStep === 5 && <Step6_QuantityRules />}
      {currentStep === 6 && <Step7_ResultsDashboard />}
      <StepController steps={steps} />
    </Box>
  )
}

export default WizardContainer
