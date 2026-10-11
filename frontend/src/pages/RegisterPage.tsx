import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { ApiError, errorMessage, type FieldErrors } from '../api/client'
import { AuthShell } from '../components/layout/AuthShell'
import { PasswordField } from '../components/common/PasswordField'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// Mirrors the rules the API enforces, so people get instant feedback while typing.
function validate(name: string, email: string, password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address'
  if (password.length < 8) errors.password = 'Password must be at least 8 characters'
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Use at least one letter and one number'
  }
  if (confirm !== password) errors.confirm = 'Passwords do not match'
  return errors
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const errors = validate(name, email, password, confirm)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const user = await signUp({ name, email, password })
      toast.success(`Welcome to Retain, ${user.name.split(' ')[0]}!`)
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors)
      }
      setFormError(errorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Full name"
            autoComplete="name"
            autoFocus
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password ?? 'At least 8 characters, with a letter and a number'}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            fullWidth
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={Boolean(fieldErrors.confirm)}
            helperText={fieldErrors.confirm}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" sx={{ fontWeight: 700 }}>
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthShell>
  )
}
