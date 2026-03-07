import { Box, Typography } from '@mui/material'
import { BasicSizeTypography } from './StyledComponent'

interface TabsRoundButtonProps {
  file: string
  columnName: string
  activeTab: string
  matchPercentage: number
  onClick: (file: string, column: string) => void
}
const TabsRoundButton = ({
  file,
  columnName,
  activeTab,
  matchPercentage,
  onClick,
}: TabsRoundButtonProps) => {
  return (
    <Box
      key={columnName}
      sx={{
        backgroundColor: activeTab === columnName ? '#404040' : '#F5F5F5',
        borderRadius: '9999px',
        padding: '6px 12px',
        cursor: 'pointer',
        flexShrink: 0, // 버튼이 줄어들지 않도록
        minWidth: 'fit-content', // 최소 너비 보장
      }}
      onClick={() => onClick(file, columnName)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <BasicSizeTypography
          sx={{ color: activeTab === columnName ? '#FFFFFF' : '#404040' }}
        >
          {columnName}
        </BasicSizeTypography>
        <Box
          sx={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: matchPercentage === 100 ? '#2AA900' : '#FF0004',
            marginLeft: '12px',
            marginRight: '6px',
          }}
        ></Box>
        <Typography
          sx={{
            fontSize: '14px',
            color: matchPercentage === 100 ? '#2AA900' : '#FF0004',
          }}
        >
          {matchPercentage}%
        </Typography>
      </Box>
    </Box>
  )
}

export default TabsRoundButton
