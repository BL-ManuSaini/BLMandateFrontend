import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, alpha, useTheme, Collapse, Drawer,
} from '@mui/material';
import {
  Dashboard, Assignment, Business, School, People,
  AccountTree, CheckCircle, Forum, Description,
  AdminPanelSettings, ExpandLess, ExpandMore,
  FiberManualRecord,
} from '@mui/icons-material';
import { useSessionStore, useUIStore } from '../../store';
import { layout } from '../../theme/tokens';
import type { UserRole } from '../../types';

import { ROUTE_PERMISSIONS } from '../../auth/permissions';

export const DRAWER_WIDTH = layout.drawerWidth;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles?: UserRole[];
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard', roles: ROUTE_PERMISSIONS['/dashboard'] },
  {
    label: 'Mandates',
    icon: <Assignment fontSize="small" />,
    path: '/mandates',
    roles: ROUTE_PERMISSIONS['/mandates'],
  },
  {
    label: 'Requirements',
    icon: <Business fontSize="small" />,
    path: '/requirements',
    roles: ROUTE_PERMISSIONS['/requirements'],
  },
  { label: 'Hiring Drives', icon: <School fontSize="small" />, path: '/drives', roles: ROUTE_PERMISSIONS['/drives'] },
  { label: 'Candidates', icon: <People fontSize="small" />, path: '/candidates', roles: ROUTE_PERMISSIONS['/candidates'] },
  { label: 'Mappings', icon: <AccountTree fontSize="small" />, path: '/mappings', roles: ROUTE_PERMISSIONS['/mappings'] },
  {
    label: 'Approvals',
    icon: <CheckCircle fontSize="small" />,
    children: [
      {
        label: 'Engineering Queue',
        icon: <FiberManualRecord sx={{ fontSize: 8 }} />,
        path: '/approvals/engineering',
        roles: ROUTE_PERMISSIONS['/approvals/engineering'],
      },
      {
        label: 'MIS Queue',
        icon: <FiberManualRecord sx={{ fontSize: 8 }} />,
        path: '/approvals/mis',
        roles: ROUTE_PERMISSIONS['/approvals/mis'],
      },
    ],
  },
  {
    label: 'Discussions',
    icon: <Forum fontSize="small" />,
    path: '/discussions',
    roles: ROUTE_PERMISSIONS['/discussions'],
  },
  {
    label: 'LOI Tracker',
    icon: <Description fontSize="small" />,
    path: '/loi',
    roles: ROUTE_PERMISSIONS['/loi'],
  },
  {
    label: 'Admin',
    icon: <AdminPanelSettings fontSize="small" />,
    children: [
      {
        label: 'User Management',
        icon: <FiberManualRecord sx={{ fontSize: 8 }} />,
        path: '/admin/users',
        roles: ROUTE_PERMISSIONS['/admin/users'],
      },
      {
        label: 'COE Management',
        icon: <FiberManualRecord sx={{ fontSize: 8 }} />,
        path: '/admin/coes',
        roles: ROUTE_PERMISSIONS['/admin/coes'],
      },
    ],
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSessionStore();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    Approvals: location.pathname.startsWith('/approvals'),
    Admin: location.pathname.startsWith('/admin'),
  });

  const isDark = theme.palette.mode === 'dark';
  const role = currentUser?.role;

  const isItemVisible = (item: NavItem): boolean => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  };

  const isGroupVisible = (item: NavItem): boolean => {
    if (!item.children) return isItemVisible(item);
    return item.children.some(isItemVisible);
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isGroupActive = (item: NavItem) =>
    item.children?.some((c) => c.path && location.pathname.startsWith(c.path));

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleNav = (path?: string) => {
    if (path) {
      navigate(path);
      onNavigate?.();
    }
  };

  const sidebarBg = isDark
    ? 'linear-gradient(180deg, #16213e 0%, #0f0f1a 100%)'
    : 'linear-gradient(180deg, #112b66 0%, #0b1e47 100%)';

  const navItemSx = (selected: boolean) => ({
    borderRadius: `${theme.shape.borderRadius}px`,
    mb: 0.25,
    py: 0.75,
    px: 1.25,
    color: selected ? '#ffffff' : '#cbd5e1',
    backgroundColor: selected
      ? alpha(theme.palette.primary.main, isDark ? 0.35 : 0.9)
      : 'transparent',
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.35 : 0.9),
      color: '#ffffff',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.4 : 0.95),
      },
    },
    '&:hover': {
      backgroundColor: selected
        ? alpha(theme.palette.primary.main, isDark ? 0.4 : 0.95)
        : 'rgba(255, 255, 255, 0.06)',
    },
  });

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: sidebarBg,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="BridgeLabz Logo"
          sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            objectFit: 'contain',
            bgcolor: '#ffffff',
            p: 0.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#ffffff', letterSpacing: '-0.02em', fontSize: '1.25rem', lineHeight: 1.1 }}>
            BLuprint.AI
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.7), fontWeight: 500, fontSize: '0.85rem' }}>
            Fellowship MIS
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1, borderColor: alpha('#ffffff', 0.12) }} />

      <List dense sx={{ flex: 1, px: 1, py: 0 }}>
        {NAV_ITEMS.filter(isGroupVisible).map((item) => {
          if (item.children) {
            const groupActive = isGroupActive(item);
            const open = openGroups[item.label] ?? false;
            const visibleChildren = item.children.filter(isItemVisible);

            return (
              <React.Fragment key={item.label}>
                <ListItemButton
                  onClick={() => toggleGroup(item.label)}
                  sx={{
                    borderRadius: `${theme.shape.borderRadius}px`,
                    mb: 0.25,
                    py: 0.75,
                    px: 1.25,
                    color: '#cbd5e1',
                    backgroundColor: groupActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: groupActive ? theme.palette.primary.light : alpha('#ffffff', 0.55) }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '13px',
                      fontWeight: groupActive ? 500 : 400,
                      letterSpacing: '0.2px',
                    }}
                  />
                  {open
                    ? <ExpandLess sx={{ fontSize: 18, color: alpha('#ffffff', 0.55) }} />
                    : <ExpandMore sx={{ fontSize: 18, color: alpha('#ffffff', 0.55) }} />}
                </ListItemButton>

                <Collapse in={open}>
                  <List dense disablePadding sx={{ pl: 1 }}>
                    {visibleChildren.map((child) => {
                      const childSelected = !!isActive(child.path);
                      return (
                        <ListItemButton
                          key={child.path}
                          selected={childSelected}
                          onClick={() => handleNav(child.path)}
                          sx={{ ...navItemSx(childSelected), pl: 2 }}
                        >
                          <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{
                              fontSize: '12px',
                              fontWeight: childSelected ? 500 : 400,
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const itemSelected = !!isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={itemSelected}
              onClick={() => handleNav(item.path)}
              sx={navItemSx(itemSelected)}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '13px',
                  fontWeight: itemSelected ? 500 : 400,
                  letterSpacing: '0.2px',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {currentUser && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="caption" display="block" textAlign="center" sx={{ color: alpha('#ffffff', 0.5) }}>
            BridgeLabz © 2026 · MM-AI v1.0
          </Typography>
        </Box>
      )}
    </Box>
  );
};

interface SidebarProps {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobile, open, onClose }) => {
  const theme = useTheme();
  const { sidebarOpen } = useUIStore();
  const isOpen = mobile ? !!open : sidebarOpen;

  if (mobile) {
    return (
      <Drawer
        variant="temporary"
        open={!!open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <SidebarContent onNavigate={onClose} />
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: isOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Box
        sx={{
          width: DRAWER_WIDTH,
          height: '100vh',
          position: 'fixed',
          left: isOpen ? 0 : -DRAWER_WIDTH,
          top: 0,
          zIndex: theme.zIndex.drawer,
          borderRight: `1px solid ${alpha('#ffffff', 0.08)}`,
          transition: theme.transitions.create('left', {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <SidebarContent />
      </Box>
    </Box>
  );
};
