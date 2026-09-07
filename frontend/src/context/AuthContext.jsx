/**
 * Authentication Context — manages user state, tokens, login/logout.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/endpoints';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state from localStorage on mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);

          // Validate token by fetching current user
          const { data } = await authAPI.getMe();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          // Token expired or invalid — clear everything
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  /**
   * Login — store tokens, set user state.
   */
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.full_name}!`);
    return data;
  }, []);

  /**
   * Register — create account.
   */
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    toast.success('Registration successful! Check your email.');
    return data;
  }, []);

  /**
   * Logout — revoke refresh token, clear state.
   */
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch {
      // Ignore logout API errors — clear locally anyway
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  /**
   * Update stored user data (after profile edit, etc.)
   */
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook for consuming auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
