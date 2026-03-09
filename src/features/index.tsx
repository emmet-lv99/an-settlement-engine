import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useState } from 'react'
import PageContainer from './settlement/PageContainer'
import WizardContainer from './settlement/components/WizardContainer'
import ShippingSellerCheckContainer from './shipping-seller/components/ShippingSellerCheckContainer'
import ShippingSupplierCheckContainer from './shipping-supplier/components/ShippingSupplierCheckContainer'

const GroupBuyingSettlement = () => {
  const [tab, setTab] = useState<'settlement' | 'shipping-supplier' | 'shipping-seller'>(
    'settlement',
  )

  return (
    <PageContainer>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          공동구매
        </Typography>
        <ToggleButtonGroup
          color="primary"
          value={tab}
          exclusive
          aria-label="Platform"
          onChange={(_, value) => {
            if (!value) {
              return
            }
            setTab(value)
          }}
        >
          <ToggleButton value="settlement">정산</ToggleButton>
          <ToggleButton value="shipping-supplier">배송비 체크(공급사)</ToggleButton>
          <ToggleButton value="shipping-seller">배송비 체크(셀러)</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {tab === 'settlement' ? (
        <WizardContainer />
      ) : tab === 'shipping-supplier' ? (
        <ShippingSupplierCheckContainer />
      ) : (
        <ShippingSellerCheckContainer />
      )}
    </PageContainer>
  )
}

export default GroupBuyingSettlement
