import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { attachServiceInterceptors } from './interceptors';

export interface ApiHelpers {
  get: <T>(url: string, params?: object) => Promise<T>;
  post: <T>(url: string, data?: unknown) => Promise<T>;
  patch: <T>(url: string, data?: unknown) => Promise<T>;
  put: <T>(url: string, data?: unknown) => Promise<T>;
  delete: <T = void>(url: string) => Promise<T>;
}

export function createApiHelpers(client: AxiosInstance): ApiHelpers {
  return {
    get: <T>(url: string, params?: object) =>
      client.get<T>(url, { params }).then((r) => r.data),

    post: <T>(url: string, data?: unknown) =>
      client.post<T>(url, data).then((r) => r.data),

    patch: <T>(url: string, data?: unknown) =>
      client.patch<T>(url, data).then((r) => r.data),

    put: <T>(url: string, data?: unknown) =>
      client.put<T>(url, data).then((r) => r.data),

    delete: <T = void>(url: string) => client.delete<T>(url).then((r) => r.data),
  };
}

export function createServiceClient(baseURL: string): { client: AxiosInstance; api: ApiHelpers } {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 seconds timeout to prevent "Request timed out" on slow backends
  });

  attachServiceInterceptors(client);

  return { client, api: createApiHelpers(client) };
}
