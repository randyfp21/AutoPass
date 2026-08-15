import api from './api';
import type { AuthResponse, LoginData, RegisterData, User } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function saveAuthData(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// ─── Auth & Profile API Calls ───────────────────────────────────────────────────────────

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  const { token, user } = response.data;
  saveAuthData(token, user);
  return response.data;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  const { token, user } = response.data;
  saveAuthData(token, user);
  return response.data;
}

export async function updateProfile(data: {
  full_name: string;
  username?: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
}): Promise<User> {
  const response = await api.put<User>('/auth/profile', data);
  const updatedUser = response.data;
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
}

export async function getUserProfile(userIdOrUsername: string): Promise<{
  user: User;
  subscribers_count: number;
  is_subscribed: boolean;
  threads_count: number;
}> {
  const clean = userIdOrUsername.replace(/^%40/, '').replace(/^@/, '');
  const response = await api.get<{
    user: User;
    subscribers_count: number;
    is_subscribed: boolean;
    threads_count: number;
  }>(`/users/${encodeURIComponent(clean)}/profile`);
  return response.data;
}

export async function toggleSubscription(userIdOrUsername: string): Promise<{
  is_subscribed: boolean;
  subscribers_count: number;
}> {
  const clean = userIdOrUsername.replace(/^%40/, '').replace(/^@/, '');
  const response = await api.post<{
    is_subscribed: boolean;
    subscribers_count: number;
  }>(`/users/${encodeURIComponent(clean)}/subscribe`);
  return response.data;
}

export function logout(): void {
  clearAuthData();
  window.location.href = '/login';
}

export async function getCurrentUser(): Promise<User> {
  const user = getStoredUser();
  if (user) {
    return user;
  }
  throw new Error('No active user session');
}

export const authService = {
  register,
  login,
  updateProfile,
  getUserProfile,
  toggleSubscription,
  logout,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  clearAuthData,
};

export default authService;
