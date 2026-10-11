import { useEffect, useState } from 'react'
import { Alert, Box, Button, Fab, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { expensesApi } from '../api'
import { errorMessage } from '../api/client'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { ExpenseDetailDialog } from '../components/expenses/ExpenseDetailDialog'
import { ExpenseFilters } from '../components/expenses/ExpenseFilters'
import { ExpenseFormDialog } from '../components/expenses/ExpenseFormDialog'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { ExpensePagination } from '../components/expenses/ExpensePagination'
import { useToast } from '../context/ToastContext'
import { useCategories } from '../hooks/useCategories'
import { useExpenses } from '../hooks/useExpenses'
import { useAppDispatch, useAppSelector } from '../store'
import { resetFilters, selectActiveFilterCount, selectFilters, setPage } from '../store/filtersSlice'
import type { Expense } from '../types'
import { formatCurrency } from '../utils/format'

// "formKey" changes every time the form opens, which remounts it so old input never lingers.
interface FormState {
  open: boolean
  expense: Expense | null
  key: number
}

export default function ExpensesPage() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const filters = useAppSelector(selectFilters)
  const activeFilterCount = useAppSelector(selectActiveFilterCount)

  const { categories } = useCategories()
  const { expenses, pagination, filteredTotal, loading, error, reload } = useExpenses()

  const [selected, setSelected] = useState<Expense | null>(null)
  const [form, setForm] = useState<FormState>({ open: false, expense: null, key: 0 })
  const [toDelete, setToDelete] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  // If the last item on the final page gets deleted, step back instead of showing an empty page.
  useEffect(() => {
    if (pagination && filters.page > pagination.totalPages) {
      dispatch(setPage(pagination.totalPages))
    }
  }, [pagination, filters.page, dispatch])

  const openForm = (expense: Expense | null) => {
    setSelected(null)
    setForm((current) => ({ open: true, expense, key: current.key + 1 }))
  }

  const handleSaved = (_expense: Expense, mode: 'created' | 'updated') => {
    setForm((current) => ({ ...current, open: false }))
    toast.success(mode === 'created' ? 'Expense added' : 'Expense updated')
    reload()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await expensesApi.remove(toDelete.id)
      toast.success('Expense deleted')
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const hasNoExpensesAtAll = !loading && !error && pagination?.total === 0 && activeFilterCount === 0
  const hasNoMatches = !loading && !error && pagination?.total === 0 && activeFilterCount > 0

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Search, filter and manage everything you have spent."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)} size="large">
            Add expense
          </Button>
        }
      />

      <ExpenseFilters categories={categories} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {pagination && pagination.total > 0 && (
        <Stack direction="row" sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography color="text.secondary">
            {pagination.total} {pagination.total === 1 ? 'expense' : 'expenses'}
            {activeFilterCount > 0 ? ' match your filters' : ''}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>Total {formatCurrency(filteredTotal)}</Typography>
        </Stack>
      )}

      {hasNoExpensesAtAll && (
        <EmptyState
          icon={<ReceiptIcon />}
          title="No expenses yet"
          description="Add your first expense and it will show up here, ready to search and filter."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
              Add your first expense
            </Button>
          }
        />
      )}

      {hasNoMatches && (
        <EmptyState
          icon={<SearchOffIcon />}
          title="Nothing matches those filters"
          description="Try a different search, or clear the filters to see everything again."
          action={
            <Button variant="outlined" onClick={() => dispatch(resetFilters())}>
              Clear filters
            </Button>
          }
        />
      )}

      {!hasNoExpensesAtAll && !hasNoMatches && !error && (
        <>
          <ExpenseList
            expenses={expenses}
            loading={loading}
            onSelect={setSelected}
            onEdit={openForm}
            onDelete={setToDelete}
          />
          {pagination && pagination.total > 0 && <ExpensePagination pagination={pagination} />}
        </>
      )}

      {/* Quick-add button for thumbs on small screens. */}
      <Fab
        color="primary"
        aria-label="Add expense"
        onClick={() => openForm(null)}
        sx={{ position: 'fixed', right: 20, bottom: 20, display: { xs: 'flex', sm: 'none' } }}
      >
        <AddIcon />
      </Fab>
      <Box sx={{ height: { xs: 56, sm: 0 } }} />

      <ExpenseDetailDialog
        expense={selected}
        onClose={() => setSelected(null)}
        onEdit={(expense) => openForm(expense)}
        onDelete={(expense) => {
          setSelected(null)
          setToDelete(expense)
        }}
      />

      <ExpenseFormDialog
        key={form.key}
        open={form.open}
        expense={form.expense}
        categories={categories}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this expense?"
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            <strong>{toDelete.title}</strong> ({formatCurrency(toDelete.amount)}) will be permanently removed.
          </>
        )}
      </ConfirmDialog>
    </>
  )
}
