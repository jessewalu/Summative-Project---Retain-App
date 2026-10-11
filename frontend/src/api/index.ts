// Typed wrappers around each API endpoint. Components call these and never touch fetch.
import type {
  AdminCategory,
  AdminInsights,
  AuthResponse,
  BudgetHistoryItem,
  BudgetSummary,
  Category,
  CategoryInput,
  Dashboard,
  DeleteCategoryResult,
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ExpenseListResponse,
  User,
} from '../types'
import { request } from './client'

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: input, skipAuthRedirect: true }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: input, skipAuthRedirect: true }),
  me: () => request<{ user: User }>('/auth/me'),
}

export const expensesApi = {
  list: (filters: ExpenseFilters, signal?: AbortSignal) =>
    request<ExpenseListResponse>('/expenses', { query: { ...filters }, signal }),
  get: (id: number) => request<Expense>(`/expenses/${id}`),
  create: (input: ExpenseInput) => request<Expense>('/expenses', { method: 'POST', body: input }),
  update: (id: number, input: ExpenseInput) =>
    request<Expense>(`/expenses/${id}`, { method: 'PUT', body: input }),
  remove: (id: number) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
}

export const categoriesApi = {
  list: () => request<Category[]>('/categories'),
}

export const budgetsApi = {
  list: () => request<BudgetHistoryItem[]>('/budgets'),
  get: (month: string) => request<BudgetSummary>(`/budgets/${month}`),
  set: (month: string, amount: number) =>
    request<BudgetSummary>(`/budgets/${month}`, { method: 'PUT', body: { amount } }),
  remove: (month: string) => request<void>(`/budgets/${month}`, { method: 'DELETE' }),
}

export const dashboardApi = {
  get: (month: string) => request<Dashboard>('/dashboard', { query: { month } }),
}

export const adminApi = {
  insights: () => request<AdminInsights>('/admin/insights'),
  categories: () => request<AdminCategory[]>('/admin/categories'),
  createCategory: (input: CategoryInput) =>
    request<AdminCategory>('/admin/categories', { method: 'POST', body: input }),
  updateCategory: (id: number, input: CategoryInput) =>
    request<AdminCategory>(`/admin/categories/${id}`, { method: 'PUT', body: input }),
  deleteCategory: (id: number) =>
    request<DeleteCategoryResult>(`/admin/categories/${id}`, { method: 'DELETE' }),
}
