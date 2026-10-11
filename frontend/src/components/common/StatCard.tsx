import type { ReactNode } from 'react'
import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material'

interface StatCardProps {
  label: string
  value: string
  helper?: ReactNode
  icon: ReactNode
  /** Colour for the icon badge and, optionally, the value (e.g. red when over budget). */
  accent?: string
  valueColor?: string
  loading?: boolean
}

export function StatCard({ label, value, helper, icon, accent = '#0f766e', valueColor, loading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 3,
            color: accent,
            bgcolor: `${accent}1a`,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={110} height={38} />
          ) : (
            <Typography variant="h5" noWrap sx={{ color: valueColor }}>
              {value}
            </Typography>
          )}
          {helper && !loading && (
            <Typography variant="caption" color="text.secondary" component="div" noWrap>
              {helper}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
