import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { ApiError, errorMessage, type FieldErrors } from '../api/client'
import { AuthShell } from '../components/layout/AuthShell'
import { PasswordField } from '../components/common/PasswordField'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    // Quick checks first so obviously empty forms never leave the browser.
    const errors: FieldErrors = {}
    if (!email.trim()) errors.email = 'Enter your email'
    if (!password) errors.password = 'Enter your password'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const user = await signIn({ email, password })
      // Send people back to the page they were trying to open, otherwise to their home screen.
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (user.role === 'admin' ? '/admin' : '/'), { replace: true })
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors)
      }
      setFormError(errorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
          />
          <PasswordField
            label="Password"
            autoComplete="current-password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            New to Retain?{' '}
            <Link component={RouterLink} to="/register" sx={{ fontWeight: 700 }}>
              Create an account
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthShell>
  )
}
