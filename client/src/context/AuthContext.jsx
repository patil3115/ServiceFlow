import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('serviceflow_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session from token
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('serviceflow_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        // Token invalid
        localStorage.removeItem('serviceflow_token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      localStorage.removeItem('serviceflow_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authService.login(email, password);
      if (res.success && res.data?.token) {
        localStorage.setItem('serviceflow_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.message || 'Invalid credentials';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const res = await authService.register(formData);
      if (res.success && res.data?.token) {
        localStorage.setItem('serviceflow_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('serviceflow_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateCurrentUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : prev));
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN',
    isAgent: user?.role === 'SUPPORT_AGENT' || user?.role === 'ADMIN',
    isEmployee: user?.role === 'EMPLOYEE',
    login,
    register,
    logout,
    updateCurrentUser,
    refreshUser: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
