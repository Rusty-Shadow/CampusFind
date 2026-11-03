import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('campusfind_token');
    if (!token) { setLoading(false); return; }
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => { localStorage.removeItem('campusfind_token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const data = await api('/auth/login', { method: 'POST', body: credentials });
      localStorage.setItem('campusfind_token', data.token);
      setUser(data.user);
      return data.user;
    },
    async register(details) {
      const data = await api('/auth/register', { method: 'POST', body: details });
      localStorage.setItem('campusfind_token', data.token);
      setUser(data.user);
      return data.user;
    },
    logout() {
      localStorage.removeItem('campusfind_token');
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
