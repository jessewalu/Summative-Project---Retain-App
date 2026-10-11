import type { ReactNode } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import type { Expense } from '../../types'
import { PAYMENT_METHOD_LABELS, formatCurrency, formatDate, formatDateTime } from '../../utils/format'
import { CategoryChip } from '../common/CategoryChip'

interface ExpenseDetailDialogProps {
  expense: Expense | null
  onClose: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 3, py: 1.25 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Box sx={{ textAlign: 'right', minWidth: 0 }}>{children}</Box>
    </Stack>
  )
}

/** Read-only view of one expense, with shortcuts to edit or delete it. */
export function ExpenseDetailDialog({ expense, onClose, onEdit, onDelete }: ExpenseDetailDialogProps) {
  return (
    <Dialog open={Boolean(expense)} onClose={onClose} maxWidth="xs" fullWidth>
      {expense && (
        <>
          <DialogTitle sx={{ pb: 0.5 }}>{expense.title}</DialogTitle>
          <DialogContent>
            <Typography variant="h4" color="primary" sx={{ mb: 1.5 }}>
              {formatCurrency(expense.amount)}
            </Typography>
            <Divider />
            <Row label="Date">
              <Typography sx={{ fontWeight: 600 }}>{formatDate(expense.date)}</Typography>
            </Row>
            <Divider />
            <Row label="Category">
              <CategoryChip name={expense.category.name} color={expense.category.color} />
            </Row>
            <Divider />
            <Row label="Payment method">
              <Typography sx={{ fontWeight: 600 }}>{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</Typography>
            </Row>
            <Divider />
            <Box sx={{ py: 1.25 }}>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                Notes
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {expense.notes ?? 'No notes added.'}
              </Typography>
            </Box>
            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Added {formatDateTime(expense.createdAt)}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
            <Button color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(expense)}>
              Delete
            </Button>
            <Stack direction="row" spacing={1}>
              <Button color="inherit" onClick={onClose}>
                Close
              </Button>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(expense)}>
                Edit
              </Button>
            </Stack>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
