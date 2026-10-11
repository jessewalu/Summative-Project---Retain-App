import { IconButton, Stack, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { currentMonth, formatMonth, shiftMonth } from '../../utils/format'

interface MonthSwitcherProps {
  month: string
  onChange: (month: string) => void
  /** Latest month that can be selected. Defaults to the current month. */
  maxMonth?: string
}

/** Previous / next month arrows around the month name. */
export function MonthSwitcher({ month, onChange, maxMonth = currentMonth() }: MonthSwitcherProps) {
  const atLimit = month >= maxMonth

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        px: 0.5,
      }}
    >
      <IconButton aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography sx={{ fontWeight: 700, minWidth: 140, textAlign: 'center' }} aria-live="polite">
        {formatMonth(month)}
      </Typography>
      <IconButton aria-label="Next month" disabled={atLimit} onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  )
}
