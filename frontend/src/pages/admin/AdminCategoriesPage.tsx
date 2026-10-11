import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import CategoryIcon from '@mui/icons-material/CategoryOutlined'
import { adminApi } from '../../api'
import { errorMessage } from '../../api/client'
import { CategoryDialog } from '../../components/admin/CategoryDialog'
import { CategoryChip } from '../../components/common/CategoryChip'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { PageHeader } from '../../components/common/PageHeader'
import { useToast } from '../../context/ToastContext'
import type { AdminCategory } from '../../types'

interface DialogState {
  open: boolean
  category: AdminCategory | null
  key: number
}

export default function AdminCategoriesPage() {
  const toast = useToast()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ open: false, category: null, key: 0 })
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.categories()
      if (!isCancelled()) setCategories(result)
    } catch (err) {
      if (!isCancelled()) setError(errorMessage(err))
    } finally {
      if (!isCancelled()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [load])

  const openDialog = (category: AdminCategory | null) =>
    setDialog((current) => ({ open: true, category, key: current.key + 1 }))

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const result = await adminApi.deleteCategory(toDelete.id)
      toast.success(
        result.reassignedExpenses > 0
          ? `Deleted. ${result.reassignedExpenses} expense${result.reassignedExpenses === 1 ? '' : 's'} moved to ${result.movedTo}.`
          : 'Category deleted',
      )
      setToDelete(null)
      void load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const defaultCategory = categories.find((c) => c.isDefault)

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Create, rename and remove the categories everyone can use."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => openDialog(null)}>
            New category
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => void load()}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        When you delete a category, its expenses are not lost. They are moved to{' '}
        <strong>{defaultCategory?.name ?? 'Uncategorized'}</strong>, the default category, which cannot be deleted.
      </Alert>

      {loading && categories.length === 0 ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : categories.length === 0 && !error ? (
        <EmptyState icon={<CategoryIcon />} title="No categories yet" description="Create the first one to get started." />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Expenses</TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>
                    <span style={{ position: 'absolute', left: -9999 }}>Actions</span>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <CategoryChip name={category.name} color={category.color} />
                        {category.isDefault && <Chip label="Default" size="small" variant="outlined" />}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700 }}>{category.expenseCount}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={category.isDefault ? 'Change colour' : 'Edit'}>
                        <IconButton aria-label={`Edit ${category.name}`} size="small" onClick={() => openDialog(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={category.isDefault ? 'The default category cannot be deleted' : 'Delete'}>
                        {/* The span lets the tooltip work even though the button is disabled. */}
                        <Box component="span">
                          <IconButton
                            aria-label={`Delete ${category.name}`}
                            size="small"
                            disabled={category.isDefault}
                            onClick={() => setToDelete(category)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <CategoryDialog
        key={dialog.key}
        open={dialog.open}
        category={dialog.category}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={(_category, mode) => {
          setDialog((current) => ({ ...current, open: false }))
          toast.success(mode === 'created' ? 'Category created' : 'Category updated')
          void load()
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete "${toDelete?.name}"?`}
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      >
        {toDelete && toDelete.expenseCount > 0 ? (
          <>
            <strong>
              {toDelete.expenseCount} expense{toDelete.expenseCount === 1 ? '' : 's'}
            </strong>{' '}
            currently use this category. They will be moved to {defaultCategory?.name ?? 'Uncategorized'}.
          </>
        ) : (
          'No expenses use this category, so nothing else will change.'
        )}
      </ConfirmDialog>
    </>
  )
}
