


/** Swagger `basePath` — appended to service host URLs from env. */
export const API_PREFIX = '/api';

const DEFAULT_MANDATE_HOST = 'https://bluprint-mandate.onrender.com';
const DEFAULT_HIRING_DRIVE_HOST = 'https://bluprint-hiring-drive.onrender.com';

/**
 * Builds the axios base URL for a backend service.
 * Env vars hold the host (e.g. http://localhost:3001); `/api` is appended per Swagger.
 * When a gateway is introduced later, point both env vars at the gateway base (e.g. http://localhost:3000/api).
 */
export function buildServiceBaseUrl(hostUrl: string): string {
  const trimmed = hostUrl.replace(/\/+$/, '');
  if (trimmed.endsWith(API_PREFIX)) return trimmed;
  return `${trimmed}${API_PREFIX}`;
}

export const MANDATE_SERVICE_HOST =
  import.meta.env.VITE_MANDATE_SERVICE_URL || DEFAULT_MANDATE_HOST;

export const HIRING_DRIVE_SERVICE_HOST =
  import.meta.env.VITE_HIRING_DRIVE_SERVICE_URL || DEFAULT_HIRING_DRIVE_HOST;

export const MANDATE_SERVICE_BASE_URL = buildServiceBaseUrl(MANDATE_SERVICE_HOST);
export const HIRING_DRIVE_SERVICE_BASE_URL = buildServiceBaseUrl(HIRING_DRIVE_SERVICE_HOST);

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
