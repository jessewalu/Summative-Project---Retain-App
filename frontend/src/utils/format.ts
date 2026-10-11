// Small formatting helpers shared across the UI.
import type { BudgetStatus, PaymentMethod } from '../types'

const CURRENCY = (import.meta.env.VITE_CURRENCY as string | undefined) ?? 'USD'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 2,
})

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)

/** Splits "2026-03-14" by hand. new Date("2026-03-14") would be read as UTC and can land a day early. */
function parseDay(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const formatDate = (isoDate: string): string =>
  parseDay(isoDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

/** "2026-03" -> "March 2026" */
export const formatMonth = (month: string): string =>
  parseDay(`${month}-01`).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })

/** Date and time for things like "registered at". Takes a full timestamp. */
export const formatDateTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const pad = (n: number) => String(n).padStart(2, '0')

/** Today as "YYYY-MM-DD" in the user's own timezone. */
export const todayISO = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const currentMonth = (): string => todayISO().slice(0, 7)

/** Moves a "YYYY-MM" month forwards or backwards. */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const shifted = new Date(year, monthNumber - 1 + delta, 1)
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile money',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  no_budget: 'No budget set',
  within: 'Within budget',
  approaching: 'Approaching limit',
  over: 'Over budget',
}

/** Colour used for each budget status, everywhere a status is shown. */
export const STATUS_COLORS: Record<BudgetStatus, string> = {
  no_budget: '#78716c',
  within: '#15803d',
  approaching: '#b45309',
  over: '#b91c1c',
}

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
