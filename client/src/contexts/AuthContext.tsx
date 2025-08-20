import { createContext, useContext, useState, type ReactNode } from 'react';

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

  const login = (incomingUser?: { name: string; avatarUrl?: string }) => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    setUser(incomingUser ?? { name: 'John Doe' });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
    setUser(null);
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
