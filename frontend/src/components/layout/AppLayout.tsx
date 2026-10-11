// The frame around every signed-in page: a sidebar on wide screens, a slide-out drawer
// plus top bar on phones. Admin links only appear for admins.
import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined'
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import SavingsIcon from '@mui/icons-material/SavingsOutlined'
import InsightsIcon from '@mui/icons-material/InsightsOutlined'
import CategoryIcon from '@mui/icons-material/CategoryOutlined'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'

const DRAWER_WIDTH = 252

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const userNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon />, end: true },
  { to: '/expenses', label: 'Expenses', icon: <ReceiptIcon /> },
  { to: '/budget', label: 'Budget', icon: <SavingsIcon /> },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Platform insights', icon: <InsightsIcon />, end: true },
  { to: '/admin/categories', label: 'Categories', icon: <CategoryIcon /> },
]

function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 800,
          fontSize: 20,
        }}
      >
        R
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Retain
      </Typography>
    </Box>
  )
}

export function AppLayout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    setMenuAnchor(null)
    signOut()
    navigate('/login', { replace: true })
  }

  const renderNav = (items: NavItem[]) =>
    items.map((item) => (
      <ListItemButton
        key={item.to}
        component={NavLink}
        to={item.to}
        end={item.end}
        onClick={() => setMobileOpen(false)}
        sx={{
          borderRadius: 3,
          mb: 0.5,
          color: 'text.secondary',
          '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 40 },
          // NavLink adds the "active" class to the link for the page we are on.
          '&.active': { bgcolor: 'primary.main', color: 'primary.contrastText' },
          '&.active:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 700 } } }} />
      </ListItemButton>
    ))

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ px: 1, py: 1.5, mb: 1 }}>
        <Logo />
      </Box>

      <List component="nav" aria-label="Main navigation" disablePadding>
        {renderNav(userNav)}
        {isAdmin && (
          <>
            <ListSubheader disableGutters sx={{ bgcolor: 'transparent', px: 2, mt: 1.5, lineHeight: '32px' }}>
              Admin
            </ListSubheader>
            {renderNav(adminNav)}
          </>
        )}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: 14, fontWeight: 700 }}>
          {user ? initials(user.name) : ''}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {user?.email}
          </Typography>
        </Box>
        <IconButton aria-label="Sign out" onClick={handleSignOut} size="small">
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Phone / tablet top bar. Hidden on desktop where the sidebar is always visible. */}
      {!isDesktop && (
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Toolbar>
            <IconButton edge="start" aria-label="Open navigation" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Logo />
            <Box sx={{ flexGrow: 1 }} />
            {isAdmin && <Chip label="Admin" size="small" color="primary" sx={{ mr: 1.5 }} />}
            <IconButton aria-label="Account menu" onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
              <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 13, fontWeight: 700 }}>
                {user ? initials(user.name) : ''}
              </Avatar>
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem disabled>{user?.email}</MenuItem>
              <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          // Keeps the drawer mounted on mobile so opening it feels instant.
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 10, md: 4 },
          maxWidth: 1280,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
