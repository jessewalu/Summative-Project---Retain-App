import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import '@fontsource-variable/plus-jakarta-sans'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { store } from './store'
import { theme } from './theme'

// Provider order matters a little: the theme wraps everything, and the auth context sits
// inside the router so route guards can both read it and redirect.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  </StrictMode>,
)
