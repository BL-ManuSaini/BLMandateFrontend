import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { mapUserFromApi } from '../mappers/user.mapper';
import { useSessionStore, useThemeStore } from '../../store';
import type { ApiError, AuthSessionDto } from '../client/types';

export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;

function assertActiveUser(data: AuthSessionDto): AuthSessionDto {
  const user = mapUserFromApi(data.user);
  if (user.status === 'suspended') {
    throw {
      message: 'Your account has been suspended. Please contact an administrator.',
    } satisfies ApiError;
  }
  return data;
}

export function useCurrentUser(options?: { enabled?: boolean }) {
  const accessToken = useSessionStore((s) => s.accessToken);
  const setCurrentUser = useSessionStore((s) => s.setCurrentUser);

  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    enabled: (options?.enabled ?? true) && !!accessToken,
    queryFn: async () => {
      const dto = await authService.getMe();
      const user = mapUserFromApi(dto);
      setCurrentUser(user);
      return user;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      assertActiveUser(await authService.login(credentials)),
    onSuccess: (data) => {
      useThemeStore.getState().setMode('light');
      setSession({
        user: mapUserFromApi(data.user),
        accessToken: data.token,
        refreshToken: data.refreshToken,
      });
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, mapUserFromApi(data.user));
      navigate('/dashboard', { replace: true });
    },
  });
}

export function useGoogleAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (credential: string) =>
      assertActiveUser(await authService.googleAuth({ credential })),
    onSuccess: (data) => {
      useThemeStore.getState().setMode('light');
      setSession({
        user: mapUserFromApi(data.user),
        accessToken: data.token,
        refreshToken: data.refreshToken,
      });
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, mapUserFromApi(data.user));
      navigate('/dashboard', { replace: true });
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useSessionStore((s) => s.logout);
  const accessToken = useSessionStore((s) => s.accessToken);

  return useMutation({
    mutationFn: async () => {
      if (accessToken) {
        await authService.logout();
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}
