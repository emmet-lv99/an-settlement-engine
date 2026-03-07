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
          {tabNames === 'keyColumn' && '키 컬럼 선택'}
          {tabNames === 'key' && '고유 값 컬럼 선택'}
          {tabNames === 'quantity' && '수량 값 컬럼 선택'}
          {tabNames === 'data' && '비교 값 컬럼 선택'}
        </BasicSizeTypography>
      </Box>
    </Box>
  )
}

export default Tabs
