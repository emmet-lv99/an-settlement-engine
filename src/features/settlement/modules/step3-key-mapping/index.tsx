// 행 매칭 키
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  cardHeaderClasses,
  styled,
} from '@mui/material'
import { useState } from 'react'
import useDataStore from '../../store/DataStore'
import DataTable from './components/DataTable'
import KeyColumnTable from './components/KeyColumnTable'
import TabsSqureButtonNoProgress from './components/TabsSqureButtonNoProgress'

const Step3_KeyMapping = () => {
  const { parsedData, selectedDataId } = useDataStore()
  const [activeTab, setActiveTab] = useState<string>('keyColumn')
  const tabNames = ['keyColumn', 'data']

  // 선택된 데이터 찾기
  const selectedData = parsedData.find(data => data.id === selectedDataId)

  return (
    <Card variant="outlined">
      <StyledCardHeader
        title={selectedData?.name}
        subheader="비교에 사용할 열을 선택해주세요. 주문번호와 상품명을 필수선택입니다."
        sx={{ padding: '', borderBottom: '1px solid #e0e0e0' }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {tabNames.map(tabName => (
            <TabsSqureButtonNoProgress
              key={tabName}
              tabNames={tabName}
              activeTab={activeTab}
              onClick={setActiveTab}
            />
          ))}
        </Box>
        {activeTab === 'keyColumn' && <KeyColumnTable />}
        {activeTab === 'data' && <DataTable />}
      </CardContent>
    </Card>
  )
}

export default Step3_KeyMapping

const StyledCardHeader = styled(CardHeader)(() => ({
  // header 요소 선택 (자식 요소)
  [`& .${cardHeaderClasses.title}`]: {
    fontSize: '18px !important',
    fontWeight: 'bold !important',
  },
  // subheader 요소 선택 (자식 요소)
  [`& .${cardHeaderClasses.subheader}`]: {
    fontSize: '14px !important',
    marginTop: '8px !important',
  },
}))
