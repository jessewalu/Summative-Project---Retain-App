// Authentication lives entirely in React Context: who is signed in, what their role is,
// and the sign up / sign in / sign out actions. Route guards read from here.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api'
import { onUnauthorized, tokenStore } from '../api/client'
import type { AuthResponse, Role, User } from '../types'

// "loading" covers the short moment on page load while we check a saved token with the server.
// Route guards wait for it to finish so a refresh does not flash the login page.
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAuthenticated: boolean
  isAdmin: boolean
  hasRole: (role: Role) => boolean
  signIn: (credentials: { email: string; password: string }) => Promise<User>
  signUp: (details: { name: string; email: string; password: string }) => Promise<User>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.get() ? 'loading' : 'unauthenticated',
  )

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const startSession = useCallback((response: AuthResponse) => {
    tokenStore.set(response.token)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  // On first load, trade a saved token for the current user (or discard it if it went stale).
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false

    authApi
      .me()
      .then(({ user: current }) => {
        if (cancelled) return
        setUser(current)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        tokenStore.clear()
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Any API call that comes back 401 (expired token, deleted account) ends the session.
  useEffect(() => {
    onUnauthorized(signOut)
    return () => onUnauthorized(null)
  }, [signOut])

  // Signing out in one browser tab should sign out the others too.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'retain.token' && event.newValue === null) {
        setUser(null)
        setStatus('unauthenticated')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const signIn = useCallback(
    async (credentials: { email: string; password: string }) =>
      startSession(await authApi.login(credentials)),
    [startSession],
  )

  const signUp = useCallback(
    async (details: { name: string; email: string; password: string }) =>
      startSession(await authApi.register(details)),
    [startSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      hasRole: (role) => user?.role === role,
      signIn,
      signUp,
      signOut,
    }),
    [user, status, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>')
  return context
}
