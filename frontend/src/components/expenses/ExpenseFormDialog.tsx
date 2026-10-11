// Create and edit share this one form. Pass `expense` to edit, leave it out to create.
import { useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { expensesApi } from '../../api'
import { ApiError, errorMessage, type FieldErrors } from '../../api/client'
import { PAYMENT_METHODS, type Category, type Expense, type PaymentMethod } from '../../types'
import { PAYMENT_METHOD_LABELS, todayISO } from '../../utils/format'

interface ExpenseFormDialogProps {
  open: boolean
  expense?: Expense | null
  categories: Category[]
  onClose: () => void
  /** Called after the API confirms the save, so the parent can refresh its data. */
  onSaved: (expense: Expense, mode: 'created' | 'updated') => void
}

interface FormValues {
  title: string
  amount: string
  categoryId: string
  date: string
  paymentMethod: PaymentMethod | ''
  notes: string
}

function initialValues(expense: Expense | null | undefined, categories: Category[]): FormValues {
  if (expense) {
    return {
      title: expense.title,
      amount: String(expense.amount),
      categoryId: String(expense.category.id),
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes ?? '',
    }
  }
  // New expenses start on the default category, today's date and the most common payment method.
  const fallback = categories.find((c) => c.isDefault) ?? categories[0]
  return {
    title: '',
    amount: '',
    categoryId: fallback ? String(fallback.id) : '',
    date: todayISO(),
    paymentMethod: 'card',
    notes: '',
  }
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.title.trim()) errors.title = 'Give the expense a title'
  const amount = Number(values.amount)
  if (!values.amount || Number.isNaN(amount) || amount <= 0) errors.amount = 'Enter an amount greater than zero'
  if (!values.categoryId) errors.categoryId = 'Pick a category'
  if (!values.date) errors.date = 'Pick a date'
  if (!values.paymentMethod) errors.paymentMethod = 'Pick a payment method'
  return errors
}

export function ExpenseFormDialog({ open, expense, categories, onClose, onSaved }: ExpenseFormDialogProps) {
  const isEditing = Boolean(expense)
  const [values, setValues] = useState<FormValues>(() => initialValues(expense, categories))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    // Clear the message for a field as soon as the person starts fixing it.
    setErrors((current) => (current[field] ? { ...current, [field]: '' } : current))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      const payload = {
        title: values.title.trim(),
        amount: Number(values.amount),
        categoryId: Number(values.categoryId),
        date: values.date,
        paymentMethod: values.paymentMethod as PaymentMethod,
        notes: values.notes.trim(),
      }
      const saved = expense ? await expensesApi.update(expense.id, payload) : await expensesApi.create(payload)
      onSaved(saved, isEditing ? 'updated' : 'created')
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        // The API names its fields "date", "categoryId" etc., the same keys this form uses.
        setErrors(error.fieldErrors)
      }
      setFormError(errorMessage(error))
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{isEditing ? 'Edit expense' : 'Add expense'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Title"
              placeholder="e.g. Lunch with Sam"
              autoFocus
              fullWidth
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              error={Boolean(errors.title)}
              helperText={errors.title}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Amount"
                  type="number"
                  fullWidth
                  value={values.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  error={Boolean(errors.amount)}
                  helperText={errors.amount}
                  slotProps={{ htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={values.date}
                  onChange={(e) => set('date', e.target.value)}
                  error={Boolean(errors.date)}
                  helperText={errors.date}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Category"
                  select
                  fullWidth
                  value={values.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  error={Boolean(errors.categoryId)}
                  helperText={errors.categoryId}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Payment method"
                  select
                  fullWidth
                  value={values.paymentMethod}
                  onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}
                  error={Boolean(errors.paymentMethod)}
                  helperText={errors.paymentMethod}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Notes (optional)"
              multiline
              minRows={2}
              maxRows={5}
              fullWidth
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
              error={Boolean(errors.notes)}
              helperText={errors.notes ?? `${values.notes.length}/1000`}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add expense'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
