import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, setApiToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('alohirafi_token'));
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem('alohirafi_token')));

  useEffect(() => {
    setApiToken(token);

    if (!token) {
      return;
    }

    let cancelled = false;

    const syncUser = async () => {
      try {
        const data = await apiRequest('/me');

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('alohirafi_token');
          setApiToken(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    };

    syncUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (payload, endpoint = '/login') => {
    const data = await apiRequest(endpoint, {
      method: 'POST',
      body: payload,
    });

    localStorage.setItem('alohirafi_token', data.token);
    setApiToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    if (token) {
      try {
        await apiRequest('/logout', { method: 'POST' });
      } catch {
        // Token cleanup still happens locally.
      }
    }

    localStorage.removeItem('alohirafi_token');
    setApiToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
