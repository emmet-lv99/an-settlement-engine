import { Typography } from '@mui/material'

interface Props {
  children: React.ReactNode
  color: string
}

const LabelMatchContainer = (Props: Props) => {
  const { children, color } = Props
  return (
    <Typography
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: color,
        padding: '2px 8px 2px 4px',
        borderRadius: '100px',
        fontSize: '12px',
        gap: '2px',
        flexGrow: 0,
        width: 'fit-content',
      }}
    >
      {children}
    </Typography>
  )
}

export default LabelMatchContainer
