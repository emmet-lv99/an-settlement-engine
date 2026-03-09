import { Box } from '@mui/material'
import Step1_FileUpload from '../modules/step1-file-upload'
import useDataStore from '../store/DataStore'
import StepperComponent from './Stepper'

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
    </Box>
  )
}

export default ShippingSupplierCheckContainer