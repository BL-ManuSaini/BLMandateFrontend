import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './authToken';
import { MANDATE_SERVICE_BASE_URL } from './config';
import type { ApiError, ApiResponse, RefreshTokenDto } from './types';

const AUTH_PATHS_WITHOUT_BEARER = ['/auth/login', '/auth/google', '/auth/register', '/auth/refresh'];

let refreshPromise: Promise<RefreshTokenDto | null> | null = null;

function isAuthPathWithoutBearer(url?: string): boolean {
  if (!url) return false;
  return AUTH_PATHS_WITHOUT_BEARER.some((path) => url.includes(path));
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as ApiResponse<T>).success === true &&
    'data' in payload
  ) {
    return (payload as ApiResponse<T>).data as T;
  }
  return payload as T;
}

function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    if (data.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    if (data.error && typeof data.error === 'string') return data.error;
    if (data.details) return typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeApiError(error: AxiosError<any>): ApiError {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please try again.',
      status: 408,
      error: 'TIMEOUT_ERROR',
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      message: 'No internet connection. Please check your network.',
      status: 0,
      error: 'OFFLINE_ERROR',
    };
  }

  if (!error.response) {
    return {
      message: 'Network error: Unable to reach server. Please try again.',
      status: 0,
      error: 'NETWORK_ERROR',
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  let fallbackMessage = 'An unexpected error occurred';
  if (status === 401) fallbackMessage = 'Session expired. Please log in again.';
  else if (status === 403) fallbackMessage = "You don't have permission to perform this action.";
  else if (status === 404) fallbackMessage = 'Requested resource was not found.';
  else if (status >= 500) fallbackMessage = 'Something went wrong on our server.';

  return {
    message: extractErrorMessage(data, fallbackMessage),
    status,
    error: typeof data === 'object' ? data?.error : undefined,
  };
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function refreshAccessToken(): Promise<RefreshTokenDto | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  try {
    const response = await axios.post<ApiResponse<RefreshTokenDto>>(
      `${MANDATE_SERVICE_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const tokens = unwrapEnvelope<RefreshTokenDto>(response.data);
    setTokens(tokens.token, tokens.refreshToken);
    return tokens;
  } catch {
    clearSession();
    redirectToLogin();
    return null;
  }
}

function getRefreshPromise(): Promise<RefreshTokenDto | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function attachServiceInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (config._skipAuth || isAuthPathWithoutBearer(config.url)) {
        return config;
      }

      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        const envelope = response.data as ApiResponse<unknown>;
        if (envelope.success === false) {
          return Promise.reject({
            message: extractErrorMessage(envelope, 'Request failed'),
            status: response.status,
            error: envelope.error,
          } satisfies ApiError);
        }
        response.data = envelope.data;
      }
      return response;
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthPathWithoutBearer(originalRequest.url)
      ) {
        originalRequest._retry = true;
        const tokens = await getRefreshPromise();

        if (tokens?.token) {
          originalRequest.headers.Authorization = `Bearer ${tokens.token}`;
          return client(originalRequest);
        }

        redirectToLogin();
      }

      return Promise.reject(normalizeApiError(error));
    }
  );
}

export { unwrapEnvelope };
