import { useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  TextField,
} from '@mui/material'
import { budgetsApi } from '../../api'
import { errorMessage } from '../../api/client'
import type { BudgetSummary } from '../../types'
import { formatMonth } from '../../utils/format'

interface BudgetDialogProps {
  open: boolean
  month: string
  /** The budget that exists now (null when none is set yet). */
  currentAmount: number | null
  onClose: () => void
  onSaved: (summary: BudgetSummary) => void
}

export function BudgetDialog({ open, month, currentAmount, onClose, onSaved }: BudgetDialogProps) {
  const [amount, setAmount] = useState(currentAmount == null ? '' : String(currentAmount))
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const value = Number(amount)
    if (!amount || Number.isNaN(value) || value <= 0) {
      setFieldError('Enter a budget greater than zero')
      return
    }
    setFieldError(null)

    setSaving(true)
    try {
      onSaved(await budgetsApi.set(month, value))
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{currentAmount == null ? 'Set budget' : 'Update budget'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            How much do you want to spend in {formatMonth(month)}?
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Monthly budget"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setFieldError(null)
            }}
            error={Boolean(fieldError)}
            helperText={fieldError}
            slotProps={{
              htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' },
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save budget'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
