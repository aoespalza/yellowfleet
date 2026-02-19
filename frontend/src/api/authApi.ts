import api from './axios';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (data: {
    username: string;
    password: string;
    email?: string;
    role?: string;
  }): Promise<AuthUser> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  me: async (): Promise<AuthUser> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getUsers: async (): Promise<AuthUser[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  updateUser: async (id: string, data: {
    username?: string;
    email?: string;
    role?: string;
    password?: string;
  }): Promise<AuthUser> => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`);
  },
};
