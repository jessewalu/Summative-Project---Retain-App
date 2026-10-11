// The one place that talks to the network. Every API module goes through `request`,
// so auth headers, JSON handling and error shapes are handled consistently.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

const TOKEN_KEY = 'retain.token'

/** Field-by-field validation messages the API sends back with a 400. */
export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  status: number
  fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// --- token storage ---------------------------------------------------------

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* storage can be blocked (private mode); the session just won't survive a refresh */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* nothing to do */
    }
  },
}

// The AuthContext registers a callback here so that an expired token anywhere in the app
// signs the user out, without the API layer needing to know anything about React.
let unauthorizedHandler: (() => void) | null = null
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

// --- request helper -----------------------------------------------------------

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
  /** Set for the login / register calls, where a 401 means "wrong credentials", not "expired session". */
  skipAuthRedirect?: boolean
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    // Blank values are simply left out, so the server never sees "?search=&categoryId=".
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const queryString = params.toString()
  return `${API_URL}${path}${queryString ? `?${queryString}` : ''}`
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, skipAuthRedirect } = options
  const token = tokenStore.get()

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    // Aborted requests are intentional (a newer filter replaced them), pass that through.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const data = (payload ?? {}) as { message?: string; errors?: FieldErrors }
    if (response.status === 401 && !skipAuthRedirect) unauthorizedHandler?.()
    throw new ApiError(
      response.status,
      data.message ?? 'Something went wrong. Please try again.',
      data.errors ?? {},
    )
  }

  return payload as T
}

/** Turns anything thrown into a message safe to show in the UI. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
