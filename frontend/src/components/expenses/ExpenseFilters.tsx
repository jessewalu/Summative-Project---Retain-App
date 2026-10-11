// The search bar, filters and sort picker. Nothing here keeps its own filter state:
// every control reads from the Redux store and dispatches an action when it changes.
import { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Collapse,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import SearchIcon from '@mui/icons-material/Search'
import TuneIcon from '@mui/icons-material/Tune'
import ClearIcon from '@mui/icons-material/FilterAltOff'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  resetFilters,
  selectActiveFilterCount,
  selectFilters,
  setAmountRange,
  setCategory,
  setDateRange,
  setPaymentMethod,
  setSearch,
  setSort,
} from '../../store/filtersSlice'
import { PAYMENT_METHODS, type Category, type PaymentMethod, type SortField, type SortOrder } from '../../types'
import { PAYMENT_METHOD_LABELS } from '../../utils/format'

const SORT_OPTIONS: { value: `${SortField}:${SortOrder}`; label: string }[] = [
  { value: 'date:desc', label: 'Newest first' },
  { value: 'date:asc', label: 'Oldest first' },
  { value: 'amount:desc', label: 'Highest amount' },
  { value: 'amount:asc', label: 'Lowest amount' },
]

export function ExpenseFilters({ categories }: { categories: Category[] }) {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectFilters)
  const activeCount = useAppSelector(selectActiveFilterCount)
  // On phones the detailed filters fold away. Whether the panel is open is pure UI state, so useState is fine.
  const [showMore, setShowMore] = useState(false)

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 4, mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          placeholder="Search title or notes"
          fullWidth
          value={filters.search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
          slotProps={{
            htmlInput: { 'aria-label': 'Search expenses' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label="Sort by"
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(':') as [SortField, SortOrder]
            dispatch(setSort({ sortBy, sortOrder }))
          }}
          sx={{ minWidth: { md: 190 } }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Badge badgeContent={activeCount} color="primary" sx={{ '& .MuiBadge-badge': { top: 6, right: 6 } }}>
          <Button
            variant={showMore ? 'contained' : 'outlined'}
            color={showMore ? 'primary' : 'inherit'}
            startIcon={<TuneIcon />}
            onClick={() => setShowMore((open) => !open)}
            aria-expanded={showMore}
            sx={{ height: 40, width: { xs: '100%', md: 'auto' } }}
          >
            Filters
          </Button>
        </Badge>
      </Stack>

      <Collapse in={showMore} unmountOnExit>
        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Category"
              value={filters.categoryId}
              onChange={(e) => dispatch(setCategory(e.target.value))}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Payment method"
              value={filters.paymentMethod}
              onChange={(e) => dispatch(setPaymentMethod(e.target.value as PaymentMethod | ''))}
            >
              <MenuItem value="">All methods</MenuItem>
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="From"
              value={filters.dateFrom}
              onChange={(e) => dispatch(setDateRange({ dateFrom: e.target.value, dateTo: filters.dateTo }))}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.dateTo || undefined } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="To"
              value={filters.dateTo}
              onChange={(e) => dispatch(setDateRange({ dateFrom: filters.dateFrom, dateTo: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.dateFrom || undefined } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Min amount"
              value={filters.minAmount}
              onChange={(e) => dispatch(setAmountRange({ minAmount: e.target.value, maxAmount: filters.maxAmount }))}
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Max amount"
              value={filters.maxAmount}
              onChange={(e) => dispatch(setAmountRange({ minAmount: filters.minAmount, maxAmount: e.target.value }))}
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, height: '100%' }}>
              <Button
                color="inherit"
                startIcon={<ClearIcon />}
                disabled={activeCount === 0}
                onClick={() => dispatch(resetFilters())}
                sx={{ width: { xs: '100%', md: 'auto' }, height: 40 }}
              >
                Clear all filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  )
}
