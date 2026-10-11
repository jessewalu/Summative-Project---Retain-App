import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import SavingsIcon from '@mui/icons-material/SavingsOutlined'
import { budgetsApi } from '../api'
import { errorMessage } from '../api/client'
import { BudgetDialog } from '../components/budget/BudgetDialog'
import { BudgetProgress } from '../components/common/BudgetProgress'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { EmptyState } from '../components/common/EmptyState'
import { MonthSwitcher } from '../components/common/MonthSwitcher'
import { PageHeader } from '../components/common/PageHeader'
import { useToast } from '../context/ToastContext'
import type { BudgetHistoryItem, BudgetSummary } from '../types'
import { currentMonth, formatCurrency, formatMonth, shiftMonth } from '../utils/format'

// A short, human sentence for each status, so the numbers come with a bit of guidance.
function adviceFor(summary: BudgetSummary): string {
  switch (summary.status) {
    case 'no_budget':
      return 'Set a budget for this month to start tracking how much room you have left.'
    case 'within':
      return `You are on track. ${formatCurrency(summary.remaining ?? 0)} is still available this month.`
    case 'approaching':
      return `Careful, you have used ${summary.percentUsed}% of your budget. Only ${formatCurrency(summary.remaining ?? 0)} is left.`
    case 'over':
      return `You have gone over by ${formatCurrency(Math.abs(summary.remaining ?? 0))}. Consider raising the budget or cutting back.`
  }
}

export default function BudgetPage() {
  const toast = useToast()
  const [month, setMonth] = useState(currentMonth)
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [history, setHistory] = useState<BudgetHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async (target: string, isCancelled: () => boolean = () => false) => {
    setLoading(true)
    setError(null)
    try {
      const [budget, all] = await Promise.all([budgetsApi.get(target), budgetsApi.list()])
      if (isCancelled()) return
      setSummary(budget)
      setHistory(all)
    } catch (err) {
      if (!isCancelled()) setError(errorMessage(err))
    } finally {
      if (!isCancelled()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(month, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [month, load])

  const openDialog = () => {
    setDialogKey((key) => key + 1)
    setDialogOpen(true)
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await budgetsApi.remove(month)
      toast.success(`Budget removed for ${formatMonth(month)}`)
      setConfirmRemove(false)
      void load(month)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRemoving(false)
    }
  }

  const hasBudget = summary?.budget != null

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle="Decide what you can spend each month and watch how you are doing."
        actions={<MonthSwitcher month={month} onChange={setMonth} maxMonth={shiftMonth(currentMonth(), 1)} />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => void load(month)}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Card sx={{ flexGrow: 1, width: '100%' }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {loading && !summary ? (
              <Skeleton variant="rounded" height={180} />
            ) : summary ? (
              <>
                <Typography variant="h6" sx={{ mb: 2.5 }}>
                  {formatMonth(month)}
                </Typography>

                {hasBudget ? (
                  <BudgetProgress
                    amount={summary.budget}
                    spent={summary.spent}
                    remaining={summary.remaining}
                    percentUsed={summary.percentUsed}
                    status={summary.status}
                  />
                ) : (
                  <EmptyState
                    icon={<SavingsIcon />}
                    title="No budget for this month"
                    description={`You have spent ${formatCurrency(summary.spent)} so far. Set a budget to see how much is left.`}
                  />
                )}

                <Typography color="text.secondary" sx={{ mt: 3 }}>
                  {adviceFor(summary)}
                </Typography>

                <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Button variant="contained" onClick={openDialog}>
                    {hasBudget ? 'Update budget' : 'Set budget'}
                  </Button>
                  {hasBudget && (
                    <Button color="error" onClick={() => setConfirmRemove(true)}>
                      Remove budget
                    </Button>
                  )}
                </Stack>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Your budgets
            </Typography>
            {history.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                Budgets you set will be listed here.
              </Typography>
            ) : (
              <List disablePadding>
                {history.map((item) => (
                  <ListItemButton
                    key={item.month}
                    selected={item.month === month}
                    onClick={() => setMonth(item.month)}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemText
                      primary={formatMonth(item.month)}
                      slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                    />
                    <Box sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</Box>
                  </ListItemButton>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>

      <BudgetDialog
        key={dialogKey}
        open={dialogOpen}
        month={month}
        currentAmount={summary?.budget ?? null}
        onClose={() => setDialogOpen(false)}
        onSaved={(updated) => {
          setDialogOpen(false)
          setSummary(updated)
          toast.success(`Budget saved for ${formatMonth(month)}`)
          void budgetsApi.list().then(setHistory).catch(() => undefined)
        }}
      />

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this budget?"
        confirmLabel="Remove"
        busy={removing}
        onConfirm={handleRemove}
        onClose={() => setConfirmRemove(false)}
      >
        Your expenses for {formatMonth(month)} stay as they are. Only the budget is cleared.
      </ConfirmDialog>
    </>
  )
}
