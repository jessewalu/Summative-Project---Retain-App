import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Skeleton, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import PeopleIcon from '@mui/icons-material/PeopleOutlined'
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import PaidIcon from '@mui/icons-material/PaidOutlined'
import EventIcon from '@mui/icons-material/CalendarMonthOutlined'
import { adminApi } from '../../api'
import { errorMessage } from '../../api/client'
import { CategoryUsageList } from '../../components/admin/CategoryUsageList'
import { CategoryChip } from '../../components/common/CategoryChip'
import { DonutChart } from '../../components/common/DonutChart'
import { PageHeader } from '../../components/common/PageHeader'
import { StatCard } from '../../components/common/StatCard'
import type { AdminInsights } from '../../types'
import { formatCurrency, formatDate, formatDateTime, initials } from '../../utils/format'

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        <Box sx={{ mt: 2.5 }}>{children}</Box>
      </CardContent>
    </Card>
  )
}

export default function AdminInsightsPage() {
  const [insights, setInsights] = useState<AdminInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminApi.insights()
      if (!isCancelled()) setInsights(result)
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

  const showSkeleton = loading && !insights
  const withSpending = insights?.spendingPerCategory.filter((c) => c.totalSpent > 0) ?? []

  return (
    <>
      <PageHeader
        title="Platform insights"
        subtitle="A bird's-eye view of everything happening on Retain."
        actions={
          <Button variant="outlined" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Registered users" value={String(insights?.totalUsers ?? 0)} icon={<PeopleIcon />} loading={showSkeleton} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Expenses recorded"
            value={String(insights?.totalExpenses ?? 0)}
            icon={<ReceiptIcon />}
            accent="#3b82f6"
            loading={showSkeleton}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total value"
            value={formatCurrency(insights?.totalExpenseValue ?? 0)}
            helper="across all users"
            icon={<PaidIcon />}
            accent="#c2410c"
            loading={showSkeleton}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="This month"
            value={String(insights?.expensesThisMonth ?? 0)}
            helper="expenses recorded"
            icon={<EventIcon />}
            accent="#7c3aed"
            loading={showSkeleton}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Section title="Spending per category" subtitle="Total value of expenses in each category, all time">
            {showSkeleton ? (
              <Skeleton variant="rounded" height={220} />
            ) : withSpending.length === 0 ? (
              <Typography color="text.secondary">No spending recorded yet.</Typography>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
                <DonutChart
                  slices={withSpending.map((c) => ({ name: c.name, value: c.totalSpent, color: c.color }))}
                  centerLabel="All time"
                  centerValue={formatCurrency(insights?.totalExpenseValue ?? 0)}
                />
                <Stack spacing={1.25} sx={{ flexGrow: 1, width: '100%', minWidth: 0 }}>
                  {withSpending.map((c) => (
                    <Stack key={c.categoryId} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <CategoryChip name={c.name} color={c.color} />
                      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCurrency(c.totalSpent)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            )}
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Section title="Most-used categories" subtitle="Top 5 by number of expenses">
            {showSkeleton ? <Skeleton variant="rounded" height={220} /> : <CategoryUsageList items={insights?.topCategories ?? []} />}
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Section title="Least-used categories" subtitle="Bottom 5 by number of expenses">
            {showSkeleton ? <Skeleton variant="rounded" height={220} /> : <CategoryUsageList items={insights?.bottomCategories ?? []} />}
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Section title="Recently added expenses" subtitle="The latest entries from anyone on the platform">
            {showSkeleton ? (
              <Skeleton variant="rounded" height={220} />
            ) : (insights?.recentExpenses.length ?? 0) === 0 ? (
              <Typography color="text.secondary">Nothing has been recorded yet.</Typography>
            ) : (
              <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
                {insights?.recentExpenses.map((expense) => (
                  <Stack key={expense.id} direction="row" sx={{ justifyContent: 'space-between', py: 1.25, gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 700 }}>
                        {expense.title}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                        <CategoryChip name={expense.category.name} color={expense.category.color} />
                        <Typography variant="caption" color="text.secondary">
                          {expense.userName} &middot; {formatDate(expense.date)}
                        </Typography>
                      </Stack>
                    </Box>
                    <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{formatCurrency(expense.amount)}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Section>
        </Grid>

        <Grid size={12}>
          <Section title="Recently registered users">
            {showSkeleton ? (
              <Skeleton variant="rounded" height={160} />
            ) : (
              <Grid container spacing={2}>
                {insights?.recentUsers.map((member) => (
                  <Grid key={member.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, fontSize: 14 }}>{initials(member.name)}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography noWrap sx={{ fontWeight: 700 }}>
                            {member.name}
                          </Typography>
                          {member.role === 'admin' && <Chip label="Admin" size="small" color="primary" variant="outlined" />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap component="div">
                          {member.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Joined {formatDateTime(member.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            )}
          </Section>
        </Grid>
      </Grid>
    </>
  )
}
