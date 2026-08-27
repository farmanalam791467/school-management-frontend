import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://school-management-backend-fxie.onrender.com';

// Create a custom axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loading, setLoading] = useState(true);

  // Set Authorization Header on start
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Fetch fresh profile
          const res = await api.get('/auth/profile');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to restore session:', err);
          // If profile fetch fails due to expired token, the interceptor might handle it,
          // but if it completely fails, clear auth.
          if (err.response && err.response.status === 401 && !refreshToken) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Axios Interceptors for Token Refresh
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const activeToken = localStorage.getItem('token');
        if (activeToken) {
          config.headers['Authorization'] = `Bearer ${activeToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const activeRefreshToken = localStorage.getItem('refreshToken');

          if (activeRefreshToken) {
            try {
              // Call refresh token endpoint
              const res = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
                refreshToken: activeRefreshToken
              });

              const { token: newAccessToken, refreshToken: newRefreshToken } = res.data;

              // Save new tokens
              localStorage.setItem('token', newAccessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              setToken(newAccessToken);
              setRefreshToken(newRefreshToken);

              // Update headers
              api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

              // Retry original request
              return api(originalRequest);
            } catch (refreshError) {
              console.error('Session expired. Logging out...', refreshError);
              logout();
              return Promise.reject(refreshError);
            }
          } else {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      
      if (res.data.twoFactorRequired) {
        return { twoFactorRequired: true, tempToken: res.data.tempToken };
      }

      const { token: accessToken, refreshToken: newRefreshToken, user: userData } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      throw error.response?.data?.message || 'Login failed';
    }
  };

  // Verify 2FA
  const verify2FA = async (code, tempToken) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-2fa`, { code, tempToken });
      const { token: accessToken, refreshToken: newRefreshToken, user: userData } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return { success: true };
    } catch (error) {
      console.error('2FA Verification failed:', error);
      throw error.response?.data?.message || 'Verification failed';
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, verify2FA, logout, loading, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
