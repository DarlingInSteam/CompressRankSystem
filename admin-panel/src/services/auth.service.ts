import { apiClient } from './api.config';
import { User, UserRole } from '../contexts/AuthContext';

/**
 * Authentication Service for handling all auth-related API calls
 */
export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserFormData {
  username: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
}

class AuthService {
  /**
   * Attempt to login with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', { username, password });
    return response.data;
  }

  /**
   * Change password for current user
   */
  async changePassword(data: ChangePasswordPayload): Promise<void> {
    await apiClient.post('/api/auth/change-password', data);
  }

  /**
   * Check if password needs to be changed (for first login)
   */
  async checkPasswordReset(): Promise<boolean> {
    const response = await apiClient.get<{ resetRequired: boolean }>('/api/auth/password-reset-required');
    return response.data.resetRequired;
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: UserFormData): Promise<User> {
    const response = await apiClient.post<User>('/api/auth/users', userData);
    return response.data;
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: number, userData: Partial<UserFormData>): Promise<User> {
    const response = await apiClient.put<User>(`/api/auth/users/${userId}`, userData);
    return response.data;
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/api/auth/users');
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    const response = await apiClient.get<User>(`/api/auth/users/${userId}`);
    return response.data;
  }

  /**
   * Delete user by ID (admin only)
   */
  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/api/auth/users/${userId}`);
  }
}

export const authService = new AuthService();