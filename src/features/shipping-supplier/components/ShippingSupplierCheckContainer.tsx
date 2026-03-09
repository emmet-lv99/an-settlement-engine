import { Box } from '@mui/material'
import Step1_FileUpload from '../modules/step1-file-upload'
import Step2_SourceSelection from '../modules/step2-source-selection'
import useDataStore from '../store/DataStore'
import StepController from './StepController'
import StepperComponent from './Stepper'

 const steps = [
  '파일 업로드',
  '시트 선택',
  '중복 데이터 제거',
  '배송비 수량 체크',
] 

const ShippingSupplierCheckContainer = () => {

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
      {currentStep === 1 && <Step2_SourceSelection/>}
    <StepController  steps={steps}/>
    </Box>
  )
}

export default ShippingSupplierCheckContainer