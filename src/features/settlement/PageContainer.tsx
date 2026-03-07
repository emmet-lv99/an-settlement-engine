import { Container } from '@mui/material'

interface PageContainerProps {
  children: React.ReactNode
}

function PageContainer({ children }: PageContainerProps) {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {children}
    </Container>
  )
}

export default PageContainer
