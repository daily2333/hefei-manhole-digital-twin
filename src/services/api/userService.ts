import { apiClient, setAuthToken } from './client';

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: string;
  status: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const res = await apiClient.post('/users/login', { username, password });
  const { token, user } = res.data.data;
  setAuthToken(token);
  sessionStorage.setItem('auth_token', token);
  sessionStorage.setItem('auth_user', JSON.stringify(user));
  return { token, user };
};

export const logout = (): void => {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_user');
  setAuthToken(null);
};

export const getStoredUser = (): User | null => {
  try {
    const raw = sessionStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return sessionStorage.getItem('auth_token');
};

export const verifyToken = async (): Promise<User> => {
  const res = await apiClient.get('/users/me');
  return res.data.data;
};

export const fetchUsers = async (): Promise<User[]> => {
  const res = await apiClient.get('/users');
  return res.data.data;
};

export const fetchUser = async (id: string): Promise<User> => {
  const res = await apiClient.get(`/users/${id}`);
  return res.data.data;
};

export const createUser = async (data: Partial<User> & { password: string }): Promise<User> => {
  const res = await apiClient.post('/users', data);
  return res.data.data;
};

export const updateUser = async (id: string, data: Partial<User> & { password?: string }): Promise<User> => {
  const res = await apiClient.put(`/users/${id}`, data);
  return res.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
