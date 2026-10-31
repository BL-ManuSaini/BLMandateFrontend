import React, { useState, useMemo } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Badge, Avatar, Menu, MenuItem, Tooltip,
  Divider, alpha, useTheme,
} from '@mui/material';
import {
  Notifications, LightMode, DarkMode, Logout,
  MenuOpen, Menu as MenuIcon,
} from '@mui/icons-material';
import { Backdrop, CircularProgress } from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { useThemeStore, useSessionStore, useUIStore } from '../../store';
import { useNotifications, useMarkNotificationRead } from '../../api/hooks';
import { useLogout } from '../../api/hooks/useAuth';
import { ROLE_LABELS } from '../../auth/permissions';
import { timeAgo } from '../../utils';
import { DRAWER_WIDTH } from './Sidebar';
import { layout } from '../../theme/tokens';

interface TopbarProps {
  isMobile?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ isMobile = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeStore();
  const { currentUser } = useSessionStore();
  const { mutate: signOut, isPending: isSigningOut } = useLogout();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const { data: notifications = [] } = useNotifications(currentUser?.id);
  const { mutate: markRead } = useMarkNotificationRead();

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const userInitials = useMemo(() => {
    if (currentUser?.avatar) return currentUser.avatar;
    if (currentUser?.name) return currentUser.name.slice(0, 2).toUpperCase();
    return 'AM';
  }, [currentUser]);

  const handleLogout = () => {
    
    signOut();
    setAnchorEl(null);
    localStorage.clear()
  };

  const showDesktopSidebar = !isMobile && sidebarOpen;
  const appBarLeft = showDesktopSidebar ? DRAWER_WIDTH : 0;

  const menuPaperSx = {
    minWidth: 180,
    borderRadius: `${theme.shape.borderRadius}px`,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: 'background.paper',
    mt: 0.5,
    boxShadow: theme.shadows[4],
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: appBarLeft,
        width: showDesktopSidebar ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
        transition: theme.transitions.create(['left', 'width'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
        zIndex: theme.zIndex.drawer + 1,
        color: 'text.primary',
        backgroundColor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${layout.topbarHeight}px !important`,
          height: layout.topbarHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0}>
          <IconButton onClick={toggleSidebar} size="small" aria-label="Toggle sidebar">
            {sidebarOpen ? <MenuOpen fontSize="small" /> : <MenuIcon fontSize="small" />}
          </IconButton>

          <Box display="flex" alignItems="center" gap={1.25} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Box
              component="img"
              src="/logo.png"
              alt="BridgeLabz Logo"
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1.5px solid rgba(0,0,0,0.12)',
                objectFit: 'contain',
                bgcolor: '#ffffff',
                p: 0.4,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            />
            <Typography
              variant="body1"
              fontWeight={800}
              color="text.primary"
              noWrap
            >
              BLuprint.AI
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1.5 }}>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton onClick={toggleMode} size="small" color="inherit">
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              size="small"
              color="inherit"
            >
              <Badge badgeContent={unread} color="error" max={9}>
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: '4px 10px',
                minWidth: { xs: 'auto', sm: 120 },
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
                transition: 'background-color 0.15s ease',
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </Avatar>

              <Box sx={{ overflow: 'hidden', textAlign: 'left', flex: 1, display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} noWrap lineHeight={1.2}>
                  {currentUser?.name || 'Admin User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {currentUser?.role ? ROLE_LABELS[currentUser.role] : 'Account'}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: menuPaperSx }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={700}>{currentUser?.name || 'Admin User'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {currentUser?.role ? ROLE_LABELS[currentUser.role] : 'Administrator'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} disabled={isSigningOut} sx={{ gap: 1, py: 1 }}>
          {isSigningOut ? (
            <CircularProgress size={16} color="primary" sx={{ mr: 0.5 }} />
          ) : (
            <Logout fontSize="small" color="action" />
          )}
          <Typography variant="body2">{isSigningOut ? 'Signing out...' : 'Sign out'}</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{ sx: { ...menuPaperSx, width: 320 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={700}>Notifications</Typography>
          {unread > 0 && (
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              {unread} unread
            </Typography>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => {
                markRead(n.id);
                if (n.linkTo) navigate(n.linkTo);
                setNotifAnchor(null);
              }}
              sx={{
                py: 1.25,
                px: 2,
                gap: 1,
                alignItems: 'flex-start',
                background: !n.read ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                borderLeft: !n.read ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={n.read ? 400 : 600}
                  sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}
                >
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                  {timeAgo(n.createdAt)}
                </Typography>
              </Box>
              {!n.read && (
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75, flexShrink: 0 }} />
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </AppBar>
  );
};
