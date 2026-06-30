import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSession, getProfileUsername, signOut } from '../lib/api/auth';

interface AuthContextValue {
  userName: string;
  loading: boolean;
  isAuthenticated: boolean;
  login: (name: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getSession().then(async (session) => {
      if (session) {
        const name = await getProfileUsername();
        setUserName(name || session.user.email?.split('@')[0] || 'Usuario');
        setIsAuthenticated(true);
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback((name: string) => {
    setUserName(name);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUserName('');
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ userName, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
