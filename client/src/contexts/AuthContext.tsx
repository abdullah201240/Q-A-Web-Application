import { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  currentPage: 'login' | 'signup' | 'dashboard';
  login: () => void;
  logout: () => void;
  navigateTo: (page: 'login' | 'signup' | 'dashboard') => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'dashboard'>('login');

  const login = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  const navigateTo = (page: 'login' | 'signup' | 'dashboard') => {
    setCurrentPage(page);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentPage, login, logout, navigateTo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
