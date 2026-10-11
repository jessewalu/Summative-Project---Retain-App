import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import AddIcon from '@mui/icons-material/Add'
import PaidIcon from '@mui/icons-material/PaidOutlined'
import SavingsIcon from '@mui/icons-material/SavingsOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import PieChartIcon from '@mui/icons-material/PieChartOutlined'
import { dashboardApi } from '../api'
import { errorMessage } from '../api/client'
import { BudgetProgress } from '../components/common/BudgetProgress'
import { CategoryChip } from '../components/common/CategoryChip'
import { DonutChart } from '../components/common/DonutChart'
import { EmptyState } from '../components/common/EmptyState'
import { MonthSwitcher } from '../components/common/MonthSwitcher'
import { PageHeader } from '../components/common/PageHeader'
import { StatCard } from '../components/common/StatCard'
import { ExpenseFormDialog } from '../components/expenses/ExpenseFormDialog'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCategories } from '../hooks/useCategories'
import type { Dashboard } from '../types'
import { STATUS_COLORS, currentMonth, formatCurrency, formatDate, formatMonth } from '../utils/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { categories } = useCategories()

  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async (target: string, isCancelled: () => boolean = () => false) => {
    setLoading(true)
    setError(null)
    try {
      const result = await dashboardApi.get(target)
      if (!isCancelled()) setData(result)
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

  const firstName = user?.name.split(' ')[0] ?? ''
  const budget = data?.budget
  const showSkeleton = loading && !data

  const remainingLabel = budget?.amount == null ? 'Remaining budget' : budget.remaining != null && budget.remaining < 0 ? 'Over budget by' : 'Remaining budget'
  const remainingValue =
    budget?.amount == null ? 'No budget' : formatCurrency(Math.abs(budget.remaining ?? 0))

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle={`Here is how ${formatMonth(month)} is going.`}
        actions={
          <>
            <MonthSwitcher month={month} onChange={setMonth} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormKey((k) => k + 1)
                setFormOpen(true)
              }}
            >
              Add expense
            </Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => void load(month)}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Box sx={{ opacity: loading && data ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Total spent"
              value={formatCurrency(data?.totalSpent ?? 0)}
              helper={`${data?.expenseCount ?? 0} ${data?.expenseCount === 1 ? 'expense' : 'expenses'}`}
              icon={<PaidIcon />}
              loading={showSkeleton}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label={remainingLabel}
              value={remainingValue}
              helper={budget?.amount == null ? 'Set one on the Budget page' : `of ${formatCurrency(budget.amount)}`}
              icon={<SavingsIcon />}
              accent={budget ? STATUS_COLORS[budget.status] : undefined}
              valueColor={budget?.status === 'over' ? STATUS_COLORS.over : undefined}
              loading={showSkeleton}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Highest expense"
              value={data?.highestExpense ? formatCurrency(data.highestExpense.amount) : '-'}
              helper={data?.highestExpense?.title ?? 'Nothing recorded yet'}
              icon={<TrendingUpIcon />}
              accent="#c2410c"
              loading={showSkeleton}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Top category"
              value={data?.spendingByCategory[0]?.name ?? '-'}
              helper={
                data?.spendingByCategory[0]
                  ? `${formatCurrency(data.spendingByCategory[0].total)} (${data.spendingByCategory[0].percentage}%)`
                  : 'Nothing recorded yet'
              }
              icon={<PieChartIcon />}
              accent="#7c3aed"
              loading={showSkeleton}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2.5 }}>
                  Monthly budget
                </Typography>
                {showSkeleton || !budget ? (
                  <Skeleton variant="rounded" height={130} />
                ) : (
                  <BudgetProgress
                    amount={budget.amount}
                    spent={data?.totalSpent ?? 0}
                    remaining={budget.remaining}
                    percentUsed={budget.percentUsed}
                    status={budget.status}
                  />
                )}
                <Button component={RouterLink} to="/budget" sx={{ mt: 2.5 }} size="small">
                  {budget?.amount == null ? 'Set a budget' : 'Manage budget'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Spending by category
                </Typography>
                {showSkeleton ? (
                  <Skeleton variant="rounded" height={200} />
                ) : data && data.spendingByCategory.length > 0 ? (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    sx={{ alignItems: 'center' }}
                  >
                    <DonutChart
                      slices={data.spendingByCategory.map((c) => ({ name: c.name, value: c.total, color: c.color }))}
                      centerLabel="Total"
                      centerValue={formatCurrency(data.totalSpent)}
                    />
                    <Stack spacing={1.25} sx={{ flexGrow: 1, width: '100%', minWidth: 0 }}>
                      {data.spendingByCategory.map((category) => (
                        <Stack
                          key={category.categoryId}
                          direction="row"
                          sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
                        >
                          <CategoryChip name={category.name} color={category.color} />
                          <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {formatCurrency(category.total)}
                            <Typography component="span" variant="caption" color="text.secondary">
                              {' '}
                              {category.percentage}%
                            </Typography>
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <EmptyState
                    icon={<PieChartIcon />}
                    title="No spending this month"
                    description="Once you add expenses, you will see where your money goes."
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Recent expenses</Typography>
                  <Button component={RouterLink} to="/expenses" size="small">
                    View all
                  </Button>
                </Stack>
                {showSkeleton ? (
                  <Skeleton variant="rounded" height={160} />
                ) : data && data.recentExpenses.length > 0 ? (
                  <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
                    {data.recentExpenses.map((expense) => (
                      <Stack
                        key={expense.id}
                        direction="row"
                        sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.5, gap: 2 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontWeight: 700 }}>
                            {expense.title}
                          </Typography>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                            <CategoryChip name={expense.category.name} color={expense.category.color} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(expense.date)}
                            </Typography>
                          </Stack>
                        </Box>
                        <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState
                    icon={<ReceiptIcon />}
                    title="No expenses in this month"
                    description="Add one and it will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <ExpenseFormDialog
        key={formKey}
        open={formOpen}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          toast.success('Expense added')
          void load(month)
        }}
      />
    </>
  )
}
