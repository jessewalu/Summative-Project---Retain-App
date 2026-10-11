// Shared two-panel layout for the sign in and sign up screens.
import type { ReactNode } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded'

const highlights = [
  'Log every expense in seconds',
  'Set a monthly budget and see how you are tracking',
  'See exactly where your money goes, by category',
]

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' } }}>
      {/* Brand panel: hidden on phones so the form gets the whole screen. */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: 'white',
          background:
            'radial-gradient(circle at 20% 15%, #14b8a6 0%, transparent 45%), linear-gradient(160deg, #0f766e 0%, #134e4a 100%)',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255,255,255,0.18)',
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            R
          </Box>
          <Typography variant="h5">Retain</Typography>
        </Stack>

        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, mb: 3 }}>
            Keep more of what you earn.
          </Typography>
          <Stack spacing={1.5}>
            {highlights.map((line) => (
              <Stack key={line} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: '#5eead4' }} />
                <Typography sx={{ opacity: 0.92 }}>{line}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Personal expense &amp; budget manager
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4.5 }, borderRadius: 5 }}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Paper>
      </Box>
    </Box>
  )
}
