import type { ReactNode } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Used before anything destructive (deleting an expense or a category). */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{children}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={busy} color="error" variant="contained">
          {busy ? 'Working...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
