// Every search, filter and sort setting for the expense list lives here, in Redux.
// Components dispatch actions; the list reads the state back and asks the API for it.
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ExpenseFilters, PaymentMethod, SortField, SortOrder } from '../types'

export const DEFAULT_PAGE_SIZE = 10

export const initialFilters: ExpenseFilters = {
  search: '',
  categoryId: '',
  paymentMethod: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  sortOrder: 'desc',
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFilters,
  reducers: {
    // Changing any filter means the old page number no longer makes sense,
    // so each of these also jumps back to page 1.
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload
      state.page = 1
    },
    setCategory(state, action: PayloadAction<string>) {
      state.categoryId = action.payload
      state.page = 1
    },
    setPaymentMethod(state, action: PayloadAction<PaymentMethod | ''>) {
      state.paymentMethod = action.payload
      state.page = 1
    },
    setDateRange(state, action: PayloadAction<{ dateFrom: string; dateTo: string }>) {
      state.dateFrom = action.payload.dateFrom
      state.dateTo = action.payload.dateTo
      state.page = 1
    },
    setAmountRange(state, action: PayloadAction<{ minAmount: string; maxAmount: string }>) {
      state.minAmount = action.payload.minAmount
      state.maxAmount = action.payload.maxAmount
      state.page = 1
    },
    setSort(state, action: PayloadAction<{ sortBy: SortField; sortOrder: SortOrder }>) {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
      state.page = 1
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload)
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.limit = action.payload
      state.page = 1
    },
    // Clears the filters but keeps how the user likes to sort and page.
    resetFilters(state) {
      return { ...initialFilters, sortBy: state.sortBy, sortOrder: state.sortOrder, limit: state.limit }
    },
  },
})

export const {
  setSearch,
  setCategory,
  setPaymentMethod,
  setDateRange,
  setAmountRange,
  setSort,
  setPage,
  setPageSize,
  resetFilters,
} = filtersSlice.actions

// --- selectors ---------------------------------------------------------------

type WithFilters = { filters: ExpenseFilters }

export const selectFilters = (state: WithFilters): ExpenseFilters => state.filters

/** How many narrowing filters are on (sorting and paging do not count). Drives the badge. */
export const selectActiveFilterCount = (state: WithFilters): number => {
  const { search, categoryId, paymentMethod, dateFrom, dateTo, minAmount, maxAmount } = state.filters
  return [search, categoryId, paymentMethod, dateFrom || dateTo, minAmount || maxAmount].filter(
    (value) => value !== '',
  ).length
}

export default filtersSlice.reducer
