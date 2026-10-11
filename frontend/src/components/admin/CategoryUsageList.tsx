import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import type { CategoryUsage } from '../../types'
import { formatCurrency } from '../../utils/format'
import { CategoryChip } from '../common/CategoryChip'

interface CategoryUsageListProps {
  items: CategoryUsage[]
}

/** Ranked list of categories with a bar showing how many expenses use each one. */
export function CategoryUsageList({ items }: CategoryUsageListProps) {
  // Bars are scaled against the biggest value in this list. The `|| 1` stops a divide-by-zero
  // when every category has no expenses yet.
  const max = Math.max(...items.map((item) => item.expenseCount), 0) || 1

  return (
    <Stack spacing={2}>
      {items.map((item, index) => (
        <Box key={item.categoryId}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75, gap: 2 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 16, fontWeight: 700 }}>
                {index + 1}
              </Typography>
              <CategoryChip name={item.name} color={item.color} />
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {item.expenseCount} {item.expenseCount === 1 ? 'expense' : 'expenses'}
              <Typography component="span" variant="caption" color="text.secondary">
                {' '}
                &middot; {formatCurrency(item.totalSpent)}
              </Typography>
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(item.expenseCount / max) * 100}
            aria-label={`${item.name} usage`}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#e7e5e4',
              '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: item.color },
            }}
          />
        </Box>
      ))}
    </Stack>
  )
}
