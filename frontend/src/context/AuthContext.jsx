import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, authRequest } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const refreshUser = async () => {
    const data = await apiRequest('/user');
    setUser(data.user);
    return data.user;
  };

  useEffect(() => {
    let cancelled = false;

    const syncUser = async () => {
      try {
        const data = await apiRequest('/user');

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
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
  }, []);

  const login = async (payload, endpoint = '/login') => {
    await authRequest(endpoint, {
      method: 'POST',
      body: payload,
    });

    const me = await refreshUser();

    return { user: me };
  };

  const logout = async () => {
    try {
      await authRequest('/logout', { method: 'POST' });
    } catch {
      // Session cleanup still happens locally.
    }

    setUser(null);
  };

  return <AuthContext.Provider value={{ user, setUser, booting, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
