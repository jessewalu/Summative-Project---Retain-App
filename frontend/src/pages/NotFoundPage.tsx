import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

interface StatusPageProps {
  code: string
  title: string
  message: string
}

function StatusPage({ code, title, message }: StatusPageProps) {
  return (
    <Box sx={{ minHeight: '70dvh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
      <Box>
        <Typography sx={{ fontSize: 72, fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>{code}</Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 360, mx: 'auto' }}>
          {message}
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to dashboard
        </Button>
      </Box>
    </Box>
  )
}

export function NotFoundPage() {
  return <StatusPage code="404" title="Page not found" message="That page does not exist or has moved." />
}

export function ForbiddenPage() {
  return <StatusPage code="403" title="Admins only" message="You need an admin account to open that page." />
}
