import { useCallback, useEffect, useMemo, useState } from 'react'
import { expensesApi } from '../api'
import { errorMessage } from '../api/client'
import { selectFilters } from '../store/filtersSlice'
import { useAppSelector } from '../store'
import type { Expense, Pagination } from '../types'
import { useDebounce } from './useDebounce'

/**
 * Fetches the expense list for whatever is currently in the Redux filter state.
 * Typing fields (search, min and max amount) are debounced so we do not hit the API
 * on every keystroke, while everything else (category, sort, page...) reacts instantly.
 */
export function useExpenses() {
  const filters = useAppSelector(selectFilters)

  const search = useDebounce(filters.search)
  const minAmount = useDebounce(filters.minAmount)
  const maxAmount = useDebounce(filters.maxAmount)

  const effective = useMemo(
    () => ({ ...filters, search, minAmount, maxAmount }),
    [filters, search, minAmount, maxAmount],
  )

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filteredTotal, setFilteredTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Bumping this number re-runs the fetch (used after create / edit / delete).
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    // If the filters change again before this request returns, drop the old one.
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    expensesApi
      .list(effective, controller.signal)
      .then((result) => {
        setExpenses(result.data)
        setPagination(result.pagination)
        setFilteredTotal(result.filteredTotal)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(errorMessage(err))
        setLoading(false)
      })

    return () => controller.abort()
  }, [effective, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { expenses, pagination, filteredTotal, loading, error, reload }
}
