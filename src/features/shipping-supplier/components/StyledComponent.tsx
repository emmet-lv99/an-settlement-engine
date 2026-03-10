import { styled, TableCell, tableCellClasses, Typography } from '@mui/material'

export const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#FAFAFA',
    color: '#404040',
    fontSize: 12,
    fontWeight: 'bold',
    height: '40px',
    paddingBottom: '0',
    paddingTop: '0',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}))

export const BasicSizeTypography = styled(Typography)(() => ({
  fontSize: 14,
  color: '#404040',
}))
