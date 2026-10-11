// One MUI theme for the whole app: calm teal on warm paper, rounded corners, plenty of air.
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f766e', light: '#14b8a6', dark: '#115e59', contrastText: '#ffffff' },
    secondary: { main: '#c2410c' },
    success: { main: '#15803d' },
    warning: { main: '#b45309' },
    error: { main: '#b91c1c' },
    background: { default: '#f5f4ef', paper: '#ffffff' },
    text: { primary: '#1c1917', secondary: '#57534e' },
    divider: 'rgba(28, 25, 23, 0.1)',
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Plus Jakarta Sans Variable", "Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.015em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 12, paddingInline: 18 } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: 'rgba(28, 25, 23, 0.1)' },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 18 } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: '#57534e', whiteSpace: 'nowrap' },
      },
    },
  },
})
