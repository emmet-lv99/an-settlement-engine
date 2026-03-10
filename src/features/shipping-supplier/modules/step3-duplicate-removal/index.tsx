import { Box, Button, Card, CardContent, CardHeader, cardHeaderClasses, styled } from "@mui/material"
import { useEffect, useState } from "react"
import useDataStore from "../../store/DataStore"
import TabsSqureButtonNoProgress from "./components/TabsSqureButtonNoProgress"

const Step3_DuplicateRemoval = () => {
  const {files, parsedData, removeDuplicatesByOrderNo} = useDataStore()  
  const [activeTab, setActiveTab] = useState<string>("")

  // 데이터가 들어오면 첫 번째 시트를 기본 선택
  useEffect(() => {
    if (parsedData.length > 0 && !activeTab) {
      setActiveTab(parsedData[0].sheetName)
    }
  }, [parsedData, activeTab])
  
  return  <Card variant="outlined">
      <StyledCardHeader
        title={files ? files[0].name : null}
        subheader="각 시트별로 중복된 주문내역을 제거합니다."
        sx={{ padding: '', borderBottom: '1px solid #e0e0e0' }}
      />
      <CardContent>
        <Button sx={{marginBottom: '12px'}} onClick={removeDuplicatesByOrderNo}>전체 중복제거</Button>
        <Box sx={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {parsedData.map(item => (
            <TabsSqureButtonNoProgress
              key={item.sheetName}
              tabNames={item.sheetName}
              activeTab={activeTab}
              onClick={() => setActiveTab(item.sheetName)}
            />
          ))}
        </Box>
        {/* 선택된 시트의 데이터 표시 */}
        {activeTab && (
          <Box>
            현재 선택된 시트: <strong>{activeTab}</strong>
            {/* 여기에 중복 제거 테이블 등을 렌더링 */}
          </Box>
        )}
      </CardContent>
    </Card>
}

export default Step3_DuplicateRemoval

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