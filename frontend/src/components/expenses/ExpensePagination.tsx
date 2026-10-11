import { Box, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../store'
import { selectFilters, setPage, setPageSize } from '../../store/filtersSlice'
import type { Pagination as PaginationInfo } from '../../types'

const PAGE_SIZES = [5, 10, 20, 50]

export function ExpensePagination({ pagination }: { pagination: PaginationInfo }) {
  const dispatch = useAppDispatch()
  const { limit } = useAppSelector(selectFilters)

  const first = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1
  const last = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mt: 3, alignItems: 'center', justifyContent: 'space-between' }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {first}-{last} of {pagination.total}
      </Typography>

      <Pagination
        page={pagination.page}
        count={pagination.totalPages}
        onChange={(_event, page) => {
          dispatch(setPage(page))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        color="primary"
        shape="rounded"
        siblingCount={0}
      />

      <Box>
        <TextField
          select
          size="small"
          label="Per page"
          value={limit}
          onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
          sx={{ width: 100 }}
        >
          {PAGE_SIZES.map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Stack>
  )
}
