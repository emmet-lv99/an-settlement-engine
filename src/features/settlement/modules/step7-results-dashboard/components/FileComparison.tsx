/**
 * ============================================
 * FileComparison.tsx - 파일 비교 결과 페이지 (N-Way)
 * ============================================
 *
 * N-Way 비교 결과를 2가지 테이블로 표시합니다:
 * 1. 품목 상세 테이블 - 전체 품목 리스트 (동적 컬럼)
 * 2. 불일치 상세 테이블 - 문제 있는 품목만 (동적 컬럼)
 */

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DownloadIcon from '@mui/icons-material/Download'
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import useDataStore from '../../../store/DataStore'
import { exportComparisonResultToExcel } from '../utils/excelExportUtils'
import { generateAllTables } from '../utils/tableUtils'
import ItemDetailTable from './tables/ItemDetailTable'
import MismatchDetailTable from './tables/MismatchDetailTable'

interface FileComparisonProps {
  setCurrentView: (
    view: 'MODE_SELECTOR' | 'FILE_MERGE' | 'FILE_COMPARISON',
  ) => void
}

const FileComparison = ({ setCurrentView }: FileComparisonProps) => {
  const { comparisonResult, isComparisonLoading } = useDataStore()
  const [activeTab, setActiveTab] = useState(0)

  // ✅ Hook을 항상 최상단에서 호출 (조건부 return 전에 호출)
  // 테이블 데이터 생성 (메모이제이션으로 반복 생성 방지)
  const tables = useMemo(() => {
    if (!comparisonResult) return null
    return generateAllTables(comparisonResult)
  }, [comparisonResult])

  // 비교 결과가 없는 경우
  if (!comparisonResult && !isComparisonLoading) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentView('FILE_MERGE')}
          sx={{ mb: 3 }}
        >
          돌아가기
        </Button>
        <Box
          sx={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <Typography variant="h6">비교 결과가 없습니다</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            파일 그룹 화면에서 "파일 비교" 버튼을 클릭하세요.
          </Typography>
        </Box>
      </Box>
    )
  }

  // 로딩 중
  if (isComparisonLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6">비교 중...</Typography>
      </Box>
    )
  }

  if (!tables) return null

  const { itemDetail, mismatchItems, noneValue } = tables

  // 엑셀 내보내기 핸들러
  const handleExportExcel = () => {
    try {
      exportComparisonResultToExcel(comparisonResult!)
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error)
      alert('엑셀 파일 생성 중 오류가 발생했습니다.')
    }
  }

  // 일치율에 따른 상태 결정
  const matchRate = comparisonResult!.summary.completeMatchRate || 0
  let statusConfig: {
    icon: string
    title: string
    description: string
    iconBgColor: string
  }

  if (matchRate === 100) {
    statusConfig = {
      icon: '✅',
      title: '완전 일치',
      description: '모든 항목이 일치합니다.',
      iconBgColor: '#d4edda',
    }
  } else if (matchRate >= 80) {
    statusConfig = {
      icon: '⚠️',
      title: '부분 일치',
      description: '대부분 일치하지만 일부 항목에서 불일치가 감지되었습니다.',
      iconBgColor: '#fff3cd',
    }
  } else {
    statusConfig = {
      icon: '❌',
      title: '불일치 많음',
      description:
        '많은 항목에서 불일치가 감지되었습니다. 데이터를 확인해주세요.',
      iconBgColor: '#f8d7da',
    }
  }

  return (
    <Box>
      {/* 헤더 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setCurrentView('FILE_MERGE')}
          >
            돌아가기
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            비교 결과
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportExcel}
        >
          엑셀 다운로드
        </Button>
      </Box>

      {/* 요약 카드 (동적 상태 표시) */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              backgroundColor: statusConfig.iconBgColor,
              borderRadius: '50%',
            }}
          >
            <Typography sx={{ fontSize: '16px', lineHeight: 1 }}>
              {statusConfig.icon}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {statusConfig.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {statusConfig.description}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3} {...({} as any)}>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: '#616161', mb: 0.5 }}
              >
                {comparisonResult!.summary.totalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                전체 항목
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3} {...({} as any)}>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}
              >
                {comparisonResult!.summary.completeMatchItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                완전 일치 항목
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3} {...({} as any)}>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: '#ffebee',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: '#d32f2f', mb: 0.5 }}
              >
                {comparisonResult!.summary.partialMatchItems + comparisonResult!.summary.failedItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                불일치 항목
              </Typography>
            </Box>
          </Grid>
          {/* 5. 값 없음 (항상 표시) */}
          <Grid item xs={12} sm={6} md={3} {...({} as any)}>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: '#f3e5f5',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: '#7b1fa2', mb: 0.5 }}
              >
                {comparisonResult!.summary.noneValueItems || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                값 없음
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 탭 네비게이션 */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`전체 항목 (${itemDetail.length})`} />
          <Tab label={`불일치 항목 (${mismatchItems.length})`} />
          <Tab label={`값 없음 (${noneValue.length})`} />
        </Tabs>
      </Card>

      {/* 테이블 내용 */}
      {activeTab === 0 && (
        <ItemDetailTable
          data={itemDetail}
          groupNames={comparisonResult!.groupNames}
        />
      )}
      {activeTab === 1 && (
        <MismatchDetailTable
          data={mismatchItems}
          groupNames={comparisonResult!.groupNames}
          showMismatchType={false}
        />
      )}
      {activeTab === 2 && (
        <MismatchDetailTable
          data={noneValue}
          groupNames={comparisonResult!.groupNames}
          showMismatchType={true}
          showComparisonValue={true}
        />
      )}
    </Box>
  )
}

export default FileComparison
