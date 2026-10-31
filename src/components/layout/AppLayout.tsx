import React, { useEffect } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '../../store';
import { layout } from '../../theme/tokens';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile, setSidebarOpen]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
       {/* Mobile sidebar (temporary drawer) - only rendered on mobile */}
       {isMobile && <Sidebar mobile open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
       {/* Desktop sidebar (fixed position) - only rendered on desktop */}
       {!isMobile && <Sidebar />}

      <Box
        component="main"
        sx={{
          flex: 1,
          ml: 0, // No margin-left needed because Sidebar takes up space in the flex container!
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Topbar isMobile={isMobile} />
        <Toolbar sx={{ minHeight: `${layout.topbarHeight}px !important`, p: 0, m: 0 }} />
        <Box
          sx={{
            flex: 1,
            px: { xs: 1, sm: 1.5, md: 2 },
            py: { xs: 0.75, sm: 1, md: 1.2 },
            pt: { xs: 0.75, sm: 1, md: 1.2 },
            maxWidth: '100%',
            width: '100%',
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
