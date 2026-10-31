import { mandateApi } from '../client/mandateClient';
import type {
  ApiUser,
  AuthSessionDto,
  GoogleAuthPayload,
  LoginCredentials,
  RefreshTokenDto,
} from '../client/types';

export const authService = {
  login: (credentials: LoginCredentials) =>
    mandateApi.post<AuthSessionDto>('/auth/login', credentials),

 googleAuth: async (
  payload: GoogleAuthPayload
): Promise<AuthSessionDto> => {
  console.log("payload is coming", payload);

  const response = await mandateApi.post<AuthSessionDto>(
    "/auth/google",
    payload
  );


    console.log("Response========>:", response);
  return response;
},
 

  refresh: (refreshToken: string) =>
    mandateApi.post<RefreshTokenDto>('/auth/refresh', { refreshToken }),

  getMe: () => mandateApi.get<ApiUser>('/auth/me'),

  logout: () => mandateApi.post<void>('/auth/logout'),
};
