import { Box, Typography } from '@mui/material'
import { BasicSizeTypography } from './StyledComponent'

interface TabsProps {
  fileName: string
  activeTab: string
  matchPercentage: number
  onClick: (fileName: string) => void
}

const Tabs = (TabsProps: TabsProps) => {
  const { fileName, activeTab, matchPercentage, onClick } = TabsProps

  return (
    <Box
      key={fileName}
      sx={{
        border:
          activeTab === fileName ? '1px solid #1876D1' : '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '6px 12px',
        cursor: 'pointer',
      }}
      onClick={() => onClick(fileName)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <BasicSizeTypography>{fileName}</BasicSizeTypography>
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

export default Tabs
