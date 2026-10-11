import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/** Friendly "nothing here yet" panel, so empty lists never look broken. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2, color: 'text.secondary' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          mb: 2,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: 'rgba(15, 118, 110, 0.1)',
          color: 'primary.main',
          '& svg': { fontSize: 32 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" color="text.primary">
        {title}
      </Typography>
      {description && <Typography sx={{ mt: 0.5, maxWidth: 380, mx: 'auto' }}>{description}</Typography>}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  )
}
