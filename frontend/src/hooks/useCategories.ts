import { useCallback, useEffect, useState } from 'react'
import { categoriesApi } from '../api'
import { errorMessage } from '../api/client'
import type { Category } from '../types'

/** Loads the category list once per mount. Used by the expense form and the filters. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await categoriesApi.list())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { categories, loading, error, reload: load }
}
