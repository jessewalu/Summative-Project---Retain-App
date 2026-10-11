import { Box, Typography } from '@mui/material'

interface CategoryChipProps {
  name: string
  color: string
}

/** A coloured dot next to the category name. Compact enough for table rows and cards. */
export function CategoryChip({ name, color }: CategoryChipProps) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box
        aria-hidden
        sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
      />
      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
    </Box>
  )
}
