import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import type { BudgetStatus } from '../../types'
import { BUDGET_STATUS_LABELS, STATUS_COLORS, formatCurrency } from '../../utils/format'

interface BudgetProgressProps {
  amount: number | null
  spent: number
  remaining: number | null
  percentUsed: number | null
  status: BudgetStatus
}

/** Spent vs. budget as a bar, a status chip, and the key numbers underneath. */
export function BudgetProgress({ amount, spent, remaining, percentUsed, status }: BudgetProgressProps) {
  const color = STATUS_COLORS[status]

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {amount == null ? 'No budget set for this month' : `${percentUsed ?? 0}% of budget used`}
        </Typography>
        <Chip
          size="small"
          label={BUDGET_STATUS_LABELS[status]}
          sx={{ bgcolor: `${color}1f`, color }}
        />
      </Stack>

      <LinearProgress
        variant="determinate"
        // The bar caps at 100% visually; the percentage text above can go beyond it.
        value={amount == null ? 0 : Math.min(percentUsed ?? 0, 100)}
        aria-label="Budget used"
        sx={{
          height: 12,
          borderRadius: 6,
          bgcolor: '#e7e5e4',
          '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: color },
        }}
      />

      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5, gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Spent
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{formatCurrency(spent)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Budget
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{amount == null ? '-' : formatCurrency(amount)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            {remaining != null && remaining < 0 ? 'Over by' : 'Remaining'}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: remaining != null && remaining < 0 ? color : undefined }}>
            {remaining == null ? '-' : formatCurrency(Math.abs(remaining))}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}
