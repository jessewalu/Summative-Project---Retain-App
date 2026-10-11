// Shared types that mirror what the API sends and receives.
// Keeping them in one file means a change to the API shape shows up as a compile error
// everywhere it matters instead of as a surprise at runtime.

export type Role = 'user' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Category {
  id: number
  name: string
  color: string
  isDefault: boolean
}

/** Category as seen by an admin, with how many expenses currently use it. */
export interface AdminCategory extends Category {
  expenseCount: number
  createdAt: string
}

export const PAYMENT_METHODS = ['cash', 'card', 'mobile_money', 'bank_transfer', 'other'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface Expense {
  id: number
  title: string
  amount: number
  /** Calendar day as "YYYY-MM-DD". */
  date: string
  paymentMethod: PaymentMethod
  notes: string | null
  category: Pick<Category, 'id' | 'name' | 'color'>
  createdAt: string
  updatedAt: string
}

/** The fields the expense form edits and the API accepts. */
export interface ExpenseInput {
  title: string
  amount: number
  categoryId: number
  date: string
  paymentMethod: PaymentMethod
  notes: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ExpenseListResponse {
  data: Expense[]
  pagination: Pagination
  filteredTotal: number
}

// --- filters (lives in Redux) ---------------------------------------------

export type SortField = 'date' | 'amount'
export type SortOrder = 'asc' | 'desc'

export interface ExpenseFilters {
  search: string
  /** Empty string means "all". Kept as a string so it plugs straight into <select>. */
  categoryId: string
  paymentMethod: PaymentMethod | ''
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  sortBy: SortField
  sortOrder: SortOrder
  page: number
  limit: number
}

// --- budgets & dashboard -------------------------------------------------

export type BudgetStatus = 'no_budget' | 'within' | 'approaching' | 'over'

export interface BudgetSummary {
  month: string
  budget: number | null
  spent: number
  remaining: number | null
  percentUsed: number | null
  status: BudgetStatus
}

/** One row of the budget history list. */
export interface BudgetHistoryItem {
  month: string
  amount: number
}

export interface DashboardExpense {
  id: number
  title: string
  amount: number
  date: string
  paymentMethod: PaymentMethod
  category: Pick<Category, 'id' | 'name' | 'color'>
}

export interface CategorySpending {
  categoryId: number
  name: string
  color: string
  total: number
  count: number
  percentage: number
}

export interface Dashboard {
  month: string
  totalSpent: number
  expenseCount: number
  budget: {
    amount: number | null
    remaining: number | null
    percentUsed: number | null
    status: BudgetStatus
  }
  highestExpense: DashboardExpense | null
  spendingByCategory: CategorySpending[]
  recentExpenses: DashboardExpense[]
}

// --- admin --------------------------------------------------------------------

export interface CategoryUsage {
  categoryId: number
  name: string
  color: string
  expenseCount: number
  totalSpent: number
}

export interface AdminRecentExpense {
  id: number
  title: string
  amount: number
  date: string
  createdAt: string
  userName: string
  category: Pick<Category, 'name' | 'color'>
}

export interface AdminRecentUser {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AdminInsights {
  totalUsers: number
  totalExpenses: number
  totalExpenseValue: number
  expensesThisMonth: number
  spendingPerCategory: CategoryUsage[]
  topCategories: CategoryUsage[]
  bottomCategories: CategoryUsage[]
  recentExpenses: AdminRecentExpense[]
  recentUsers: AdminRecentUser[]
}

export interface CategoryInput {
  name: string
  color: string
}

export interface DeleteCategoryResult {
  message: string
  reassignedExpenses: number
  movedTo: string
}
