import { clearToken, request, setToken } from './client';
import type { Address, ApiSuccess, User } from '@types';

export interface LoginParams {
  email: string;
  password: string;
}
export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  const res = await request<ApiSuccess<AuthResponse>>({
    method: 'POST',
    url: '/auth/login',
    data: params,
  });
  const { token, user } = res.data;
  setToken(token);
  return { token, user };
}

export async function register(params: RegisterParams): Promise<AuthResponse> {
  const res = await request<ApiSuccess<AuthResponse>>({
    method: 'POST',
    url: '/auth/register',
    data: params,
  });
  const { token, user } = res.data;
  setToken(token);
  return { token, user };
}

export async function getMe(): Promise<User> {
  const res = await request<ApiSuccess<User>>({ method: 'GET', url: '/auth/me' });
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await request<ApiSuccess<null>>({ method: 'POST', url: '/auth/logout' });
  } finally {
    clearToken();
  }
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const res = await request<ApiSuccess<User>>({ method: 'PUT', url: '/users/me', data });
  return res.data;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await request<ApiSuccess<null>>({
    method: 'POST',
    url: '/auth/change-password',
    data: { oldPassword, newPassword },
  });
}

export async function getAddresses(): Promise<Address[]> {
  const res = await request<ApiSuccess<Address[]>>({ method: 'GET', url: '/users/me/addresses' });
  return res.data;
}

export async function createAddress(data: Omit<Address, 'id'>): Promise<Address> {
  const res = await request<ApiSuccess<Address>>({
    method: 'POST',
    url: '/users/me/addresses',
    data,
  });
  return res.data;
}

export async function updateAddress(id: string, data: Partial<Address>): Promise<Address> {
  const res = await request<ApiSuccess<Address>>({
    method: 'PUT',
    url: `/users/me/addresses/${id}`,
    data,
  });
  return res.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await request<ApiSuccess<null>>({ method: 'DELETE', url: `/users/me/addresses/${id}` });
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const res = await request<ApiSuccess<Address>>({
    method: 'PUT',
    url: `/users/me/addresses/${id}/default`,
  });
  return res.data;
}
