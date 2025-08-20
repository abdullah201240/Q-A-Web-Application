import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  currentPage: 'login' | 'signup' | 'dashboard';
  user: { name: string; avatarUrl?: string } | null;
  login: (user?: { name: string; avatarUrl?: string }) => void;
  logout: () => void;
  navigateTo: (page: 'login' | 'signup' | 'dashboard') => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const storedAccess = localStorage.getItem('accessToken');
      const storedRefresh = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');
      if (storedAccess && storedRefresh) {
        setIsAuthenticated(true);
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as { name?: string; email?: string; avatarUrl?: string };
            const derivedName = parsed.name || parsed.email || 'User';
            setUser({ name: derivedName, avatarUrl: parsed.avatarUrl });
          } catch {
            setUser({ name: 'User' });
          }
        }
        setCurrentPage('dashboard');
      }
    } catch {
      // ignore storage read errors
    }
  }, []);

  const login = (incomingUser?: { name: string; avatarUrl?: string }) => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    const effectiveUser = incomingUser ?? { name: 'User' };
    setUser(effectiveUser);
    try {
      localStorage.setItem('user', JSON.stringify(effectiveUser));
    } catch {
      // ignore storage errors
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
    setUser(null);
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch {
      // ignore storage errors
    }
  };

  const navigateTo = (page: 'login' | 'signup' | 'dashboard') => {
    setCurrentPage(page);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentPage, user, login, logout, navigateTo }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
