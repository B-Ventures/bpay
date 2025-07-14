import { useState, useEffect } from 'react';
import { useApp } from '../lib/AppContext';

export const useAuth = () => {
  const { 
    user, 
    isAdmin,
    authLoading, 
    authError, 
    login: appLogin, 
    logout: appLogout, 
    register: appRegister 
  } = useApp();

  // Debug output
  useEffect(() => {
    console.log('useAuth hook - Current auth state:', {
      user,
      isAdmin,
      authLoading,
      authError
    });
  }, [user, isAdmin, authLoading, authError]);

  const login = async (username, password) => {
    console.log('Login attempt with username:', username);
    try {
      const result = await appLogin({ username, password });
      console.log('Login successful:', result);
      return result;
    } catch (err) {
      console.error('Login failed in useAuth hook:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const result = await appLogout();
      console.log('Logout successful');
      return result;
    } catch (err) {
      console.error('Logout failed in useAuth hook:', err);
      throw err;
    }
  };

  const register = async (userData) => {
    return appRegister(userData);
  };

  return {
    user,
    isAdmin,
    isLoading: authLoading,
    error: authError,
    login,
    logout,
    register,
    // Include these for debugging
    isAuthenticated: !!user,
    userRoles: user ? (user.isAdmin || user.is_admin ? ['admin'] : ['user']) : []
  };
};