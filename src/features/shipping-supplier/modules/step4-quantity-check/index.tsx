import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import useDataStore from "../../store/DataStore";

const Step4_QuantityCheck = () => {
  const { parsedData } = useDataStore();

  // 🎯 모든 데이터를 순회하며 일반/제주 수량을 계산합니다.
  const stats = useMemo(() => {
    let totalNormal = 0;
    let totalJeju = 0;

    const sheetStats = parsedData.map(sheet => {
      const jejuCount = sheet.data.filter(row => 
        String(row['배송주소'] || '').includes('제주')
      ).length;
      
      const normalCount = sheet.data.filter((data)=> data['번호']).length;

      totalNormal += normalCount;
      totalJeju += jejuCount;

      return {
        name: sheet.sheetName,
        normal: normalCount,
        jeju: jejuCount,
        total: sheet.data.length
      };
    });

    return { totalNormal, totalJeju, totalCount: totalNormal + totalJeju, sheetStats };
  }, [parsedData]);

  return (
    <Box>
      {/* 1. 전체 요약 카드 */}
      <Card sx={{ mb: 3, bgcolor: '#f5f7fa', borderRadius: '12px' }}>
        <CardContent>
          <Typography color="textSecondary" variant="overline">전체 데이터 요약 (중복제거 후)</Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 1 }}>
            <Typography variant="h4" fontWeight="bold">{stats.totalCount.toLocaleString()} <small style={{fontSize: '18px'}}>건</small></Typography>
            <Typography color="primary" variant="body2">
              (일반: {stats.totalNormal.toLocaleString()} / 제주: {stats.totalJeju.toLocaleString()})
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 2. 시트별 리스트 */}
      <Grid container spacing={2}>
        {stats.sheetStats.map(sheet => (
          <Grid key={sheet.name} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: '10px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, borderBottom: '1px border #eee', pb: 0.5 }}>
                  {sheet.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="textSecondary">일반 배송</Typography>
                  <Typography variant="body1" fontWeight="medium">{sheet.normal.toLocaleString()} 건</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#1876D1' }}>
                  <Typography variant="body2">제주 배송 🍊</Typography>
                  <Typography variant="body1" fontWeight="bold">{sheet.jeju.toLocaleString()} 건</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Step4_QuantityCheck;
