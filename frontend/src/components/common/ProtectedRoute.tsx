// Route guards. They read the auth Context and either render the page (via <Outlet />)
// or redirect. Wrapping a group of routes in one of these protects all of them.
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'

function FullPageSpinner() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress aria-label="Loading" />
    </Box>
  )
}

/** Any signed-in user. Everyone else is sent to the login page and brought back afterwards. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

/** Only users with the given role. Signed-in users without it are sent to the 403 page. */
export function RoleRoute({ role }: { role: Role }) {
  const { status, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (!hasRole(role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}

/** Login and register pages: signed-in users have no business here, so bounce them to the app. */
export function PublicOnlyRoute() {
  const { status, isAdmin } = useAuth()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  return <Outlet />
}
