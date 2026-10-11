// Shows expenses as a table on wide screens and as tappable cards on phones.
import {
  Box,
  Card,
  CardActionArea,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import type { Expense } from '../../types'
import { PAYMENT_METHOD_LABELS, formatCurrency, formatDate } from '../../utils/format'
import { CategoryChip } from '../common/CategoryChip'

interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  onSelect: (expense: Expense) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseList({ expenses, loading, onSelect, onEdit, onDelete }: ExpenseListProps) {
  const theme = useTheme()
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'))

  // First load: show placeholder rows. Later loads keep the old rows on screen (slightly dimmed).
  if (loading && expenses.length === 0) {
    return (
      <Stack spacing={1.5} aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={isPhone ? 84 : 52} />
        ))}
      </Stack>
    )
  }

  const dim = { opacity: loading ? 0.55 : 1, transition: 'opacity 150ms' }

  if (isPhone) {
    return (
      <Stack spacing={1.25} sx={dim}>
        {expenses.map((expense) => (
          <Card key={expense.id}>
            <CardActionArea onClick={() => onSelect(expense)} sx={{ p: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700 }}>
                    {expense.title}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <CategoryChip name={expense.category.name} color={expense.category.color} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(expense.date)} &middot; {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{formatCurrency(expense.amount)}</Typography>
              </Stack>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <TableContainer sx={{ ...dim, border: 1, borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right" sx={{ width: 110 }}>
              <span style={{ position: 'absolute', left: -9999 }}>Actions</span>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow
              key={expense.id}
              hover
              onClick={() => onSelect(expense)}
              sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
            >
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</TableCell>
              <TableCell sx={{ maxWidth: 260 }}>
                <Typography noWrap sx={{ fontWeight: 600 }}>
                  {expense.title}
                </Typography>
              </TableCell>
              <TableCell>
                <CategoryChip name={expense.category.name} color={expense.category.color} />
              </TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {/* stopPropagation keeps a click on a button from also opening the detail view. */}
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    aria-label={`Edit ${expense.title}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(expense)
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    aria-label={`Delete ${expense.title}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(expense)
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
