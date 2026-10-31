import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { authService } from '../../api/services/auth.service';
import { mapUserFromApi } from '../../api/mappers/user.mapper';
import { useSessionStore } from '../../store';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accessToken = useSessionStore((s) => s.accessToken);
  const isSessionReady = useSessionStore((s) => s.isSessionReady);
  const setCurrentUser = useSessionStore((s) => s.setCurrentUser);
  const setSessionReady = useSessionStore((s) => s.setSessionReady);
  const logout = useSessionStore((s) => s.logout);
  const [hasHydrated, setHasHydrated] = React.useState(
    () => useSessionStore.persist.hasHydrated()
  );

  React.useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    return useSessionStore.persist.onFinishHydration(() => setHasHydrated(true));
  }, []);

  React.useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken) {
      logout();
      setSessionReady(true);
      return;
    }

    let cancelled = false;

    authService
      .getMe()
      .then((dto) => {
        if (cancelled) return;
        setCurrentUser(mapUserFromApi(dto));
        setSessionReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        setSessionReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, accessToken, logout, setCurrentUser, setSessionReady]);

  if (!hasHydrated || !isSessionReady) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
};
