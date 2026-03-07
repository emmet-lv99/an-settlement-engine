import { Typography } from '@mui/material'
import PageContainer from './PageContainer'
import WizardContainer from './components/WizardContainer'

const GroupBuyingSettlement = () => {
  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>
        공동구매 정산
      </Typography>
      <WizardContainer />
    </PageContainer>
  )
}

export default GroupBuyingSettlement
