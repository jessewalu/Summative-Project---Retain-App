// All the routes in one place. The guards decide who gets through:
//   PublicOnlyRoute -> login / register (signed-out visitors)
//   ProtectedRoute  -> the app itself (any signed-in user)
//   RoleRoute       -> the admin area (role === 'admin')
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from './components/common/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ForbiddenPage, NotFoundPage } from './pages/NotFoundPage'

// Each page is loaded the first time it is visited, which keeps the first download small.
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const AdminInsightsPage = lazy(() => import('./pages/admin/AdminInsightsPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'))

function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50dvh' }}>
      <CircularProgress aria-label="Loading page" />
    </Box>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="forbidden" element={<ForbiddenPage />} />

            <Route element={<RoleRoute role="admin" />}>
              <Route path="admin" element={<AdminInsightsPage />} />
              <Route path="admin/categories" element={<AdminCategoriesPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
