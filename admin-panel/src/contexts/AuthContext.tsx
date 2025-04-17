import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '../services/api.config';

// Define user roles enum
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  READER = 'READER'
}

// Define User interface
export interface User {
  id: number;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Define Token interface
interface TokenPayload {
  sub: string; // user id
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  exp: number;
}

// Define Auth Context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Create Auth Context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  login: async () => {},
  logout: () => {},
  updateUser: () => {}
});

// Create Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth state from localStorage token on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode<TokenPayload>(token);
          
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Configure axios to include the token in all requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser({
              id: parseInt(decodedToken.sub),
              username: decodedToken.username,
              role: decodedToken.role,
              firstName: decodedToken.firstName,
              lastName: decodedToken.lastName,
              email: decodedToken.email
            });
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
        localStorage.removeItem('token');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await apiClient.post('/api/auth/login', { username, password });
      const { token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set Authorization header for API requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Decode token to get user info
      const decodedToken = jwtDecode<TokenPayload>(token);
      
      // Set user state
      setUser({
        id: parseInt(decodedToken.sub),
        username: decodedToken.username,
        role: decodedToken.role,
        firstName: decodedToken.firstName,
        lastName: decodedToken.lastName,
        email: decodedToken.email
      });
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove Authorization header
    delete apiClient.defaults.headers.common['Authorization'];
    
    // Reset user state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user function
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Provide auth context to children components
  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isInitializing, 
      login, 
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using Auth Context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;