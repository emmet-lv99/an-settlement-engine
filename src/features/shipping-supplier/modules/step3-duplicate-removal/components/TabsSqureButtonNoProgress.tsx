import { Box } from '@mui/material'
import { BasicSizeTypography } from '../../../components/StyledComponent'

interface TabsProps {
  tabNames: string
  activeTab: string
  onClick: (tabNames: string) => void
}

const Tabs = (TabsProps: TabsProps) => {
  const { tabNames, activeTab, onClick } = TabsProps

  return (
    <Box
      key={tabNames}
      sx={{
        border:
          activeTab === tabNames ? '1px solid #1876D1' : '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '6px 12px',
        cursor: 'pointer',
      }}
      onClick={() => onClick(tabNames)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <BasicSizeTypography>
          {tabNames}
        </BasicSizeTypography>
      </Box>
    </Box>
  )
}

export default Tabs
