type AuthTokenAccessors = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
};

let accessors: AuthTokenAccessors | null = null;

export function bindAuthTokenAccessors(next: AuthTokenAccessors): void {
  accessors = next;
}

export function getAccessToken(): string | null {
  return accessors?.getAccessToken() ?? null;
}

export function getRefreshToken(): string | null {
  return accessors?.getRefreshToken() ?? null;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  accessors?.setTokens(accessToken, refreshToken);
}

export function clearSession(): void {
  accessors?.clearSession();
}
