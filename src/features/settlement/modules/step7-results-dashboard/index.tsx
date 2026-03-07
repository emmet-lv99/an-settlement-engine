// 비교 결과 도출

import { Box } from '@mui/material'
import { useState } from 'react'
import FileComparison from './components/FileComparison'
import FileMerge from './components/FileMerge'
import ModeSelector from './components/ModeSelector'

const Step7_ResultsDashboard = () => {
  const [currentView, setCurrentView] = useState<
    'MODE_SELECTOR' | 'FILE_MERGE' | 'FILE_COMPARISON'
  >('MODE_SELECTOR')

  return (
    <Box>
      {/* 조건부 렌더링 → CSS 숨김 방식으로 변경 (컴포넌트 상태 유지) */}
      <Box sx={{ display: currentView === 'MODE_SELECTOR' ? 'block' : 'none' }}>
        <ModeSelector setCurrentView={setCurrentView} />
      </Box>
      <Box sx={{ display: currentView === 'FILE_MERGE' ? 'block' : 'none' }}>
        <FileMerge setCurrentView={setCurrentView} />
      </Box>
      <Box
        sx={{ display: currentView === 'FILE_COMPARISON' ? 'block' : 'none' }}
      >
        <FileComparison setCurrentView={setCurrentView} />
      </Box>
    </Box>
  )
}

export default Step7_ResultsDashboard
