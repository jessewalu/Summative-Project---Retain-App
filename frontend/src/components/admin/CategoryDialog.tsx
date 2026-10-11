// Create / rename / recolour a category. The default category can only change colour.
import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { adminApi } from '../../api'
import { ApiError, errorMessage, type FieldErrors } from '../../api/client'
import type { AdminCategory } from '../../types'

const SWATCHES = ['#f97316', '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444', '#ec4899', '#eab308', '#22c55e', '#64748b', '#0ea5e9']

interface CategoryDialogProps {
  open: boolean
  category?: AdminCategory | null
  onClose: () => void
  onSaved: (category: AdminCategory, mode: 'created' | 'updated') => void
}

export function CategoryDialog({ open, category, onClose, onSaved }: CategoryDialogProps) {
  const isEditing = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? SWATCHES[0])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (name.trim().length < 2) {
      setErrors({ name: 'Name must be at least 2 characters' })
      return
    }
    setErrors({})

    setSaving(true)
    try {
      const input = { name: name.trim(), color }
      const saved = category
        ? await adminApi.updateCategory(category.id, input)
        : await adminApi.createCategory(input)
      onSaved(saved, isEditing ? 'updated' : 'created')
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors)
      setFormError(errorMessage(error))
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{isEditing ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Name"
              autoFocus
              fullWidth
              value={name}
              disabled={category?.isDefault}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name ?? (category?.isDefault ? 'The default category cannot be renamed' : undefined)}
              slotProps={{ htmlInput: { maxLength: 40 } }}
            />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Colour
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                {SWATCHES.map((swatch) => (
                  <Box
                    key={swatch}
                    component="button"
                    type="button"
                    aria-label={`Use colour ${swatch}`}
                    aria-pressed={color === swatch}
                    onClick={() => setColor(swatch)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      bgcolor: swatch,
                      cursor: 'pointer',
                      border: 3,
                      borderColor: color === swatch ? 'text.primary' : 'transparent',
                      outlineOffset: 2,
                    }}
                  />
                ))}
                <Box
                  component="input"
                  type="color"
                  aria-label="Pick a custom colour"
                  value={color}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                  sx={{ width: 36, height: 34, p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer' }}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
