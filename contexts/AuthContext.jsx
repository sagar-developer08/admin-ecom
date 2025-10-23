'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import apiService from '../lib/api-debug';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      // Small delay to ensure localStorage is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('qliq-admin-user');
        const savedTokens = localStorage.getItem('qliq-admin-tokens');
        
        console.log('🔄 Restoring session from localStorage:', {
          hasUser: !!savedUser,
          hasTokens: !!savedTokens
        });
        
        if (savedUser && savedTokens) {
          try {
            const userData = JSON.parse(savedUser);
            const tokenData = JSON.parse(savedTokens);
            
            console.log('✅ Session restored successfully:', userData.email);
            setUser(userData);
            setTokens(tokenData);
            setIsLoading(false);
            
            // Optionally verify token in background (don't wait for it)
            // Only clear session if explicitly unauthorized
            verifyToken(tokenData.accessToken).catch(err => {
              console.log('Background token verification failed:', err);
            });
          } catch (error) {
            console.error('❌ Error parsing saved auth data:', error);
            clearAuthData();
            setIsLoading(false);
          }
        } else {
          console.log('❌ No saved session found');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const verifyToken = async (accessToken) => {
    try {
      const response = await apiService.getProfile(accessToken);
      // Token is valid, user data is up to date
      const userData = response.user;
      
      // Map backend roles to frontend roles
      let frontendRole = 'vendor'; // default
      if (userData.role === 'admin' || userData.role === 'manager' || userData.role === 'super_admin') {
        frontendRole = 'superadmin';
      }
      
      const frontendUserData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: frontendRole,
        avatar: userData.name.charAt(0).toUpperCase(),
        phone: userData.phone,
        cognitoUserId: userData.cognitoUserId,
        vendorId: userData.vendorId || userData.id, // Add vendorId field
      };
      
      setUser(frontendUserData);
      // Update cookies with the mapped user data (7 days expiry)
      Cookies.set('qliq-admin-user', JSON.stringify(frontendUserData), { expires: 7 });
      setIsLoading(false);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't clear auth data immediately - user might just have saved the session
      // Only clear if it's a 401/403 (unauthorized) error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.log('Token is invalid, clearing auth data');
        clearAuthData();
      } else {
        // Network or other error - keep the user logged in
        console.log('Verification failed but keeping session (network issue)');
      }
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qliq-admin-user');
      localStorage.removeItem('qliq-admin-tokens');
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      
      const { user: userData, tokens: tokenData } = response;
      
      // Map backend roles to frontend roles
      let frontendRole = 'vendor'; // default
      if (userData.role === 'admin' || userData.role === 'manager' || userData.role === 'super_admin') {
        frontendRole = 'superadmin';
      }
      
      const frontendUserData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: frontendRole,
        avatar: userData.name.charAt(0).toUpperCase(),
        phone: userData.phone,
        cognitoUserId: userData.cognitoUserId,
        vendorId: userData.vendorId || userData.id, // Add vendorId field
      };

      setUser(frontendUserData);
      setTokens(tokenData);
      
      // Store in localStorage only (simple approach)
      if (typeof window !== 'undefined') {
        localStorage.setItem('qliq-admin-user', JSON.stringify(frontendUserData));
        localStorage.setItem('qliq-admin-tokens', JSON.stringify(tokenData));
      }
      
      return { success: true, user: frontendUserData };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if needed
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local data regardless of API call result
      clearAuthData();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshAccessToken = async () => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.refreshToken(tokens.refreshToken);
      const newTokens = response.tokens;
      
      setTokens(newTokens);
      Cookies.set('qliq-admin-tokens', JSON.stringify(newTokens), { expires: 7 });
      
      return newTokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      throw error;
    }
  };

  const value = {
    user,
    tokens,
    login,
    logout,
    refreshAccessToken,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
