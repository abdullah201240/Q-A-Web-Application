import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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

  const baseUrl = useMemo(() => {
    const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return url.replace(/\/$/, '');
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const validateTokens = async () => {
      let accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        setCurrentPage('login');
        setUser(null);
        return;
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as { name?: string; email?: string; avatarUrl?: string };
          const derivedName = parsed.name || parsed.email || 'User';
          setUser({ name: derivedName, avatarUrl: parsed.avatarUrl });
        } catch {
          setUser({ name: 'User' });
        }
      }

      const tryProfile = async (token: string) => {
        const resp = await fetch(`${baseUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        if (!resp.ok) return null;
        const data = await resp.json().catch(() => null) as { user?: { name?: string; email?: string; avatarUrl?: string } } | null;
        return data?.user ?? null;
      };

      // First try with current access token
      let profileUser = await tryProfile(accessToken);

      // If unauthorized, attempt refresh once
      if (!profileUser) {
        try {
          const refreshResp = await fetch(`${baseUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refreshToken })
          });
          if (refreshResp.ok) {
            const tokens = await refreshResp.json().catch(() => null) as { accessToken?: string; refreshToken?: string } | null;
            if (tokens?.accessToken && tokens?.refreshToken) {
              accessToken = tokens.accessToken;
              localStorage.setItem('accessToken', tokens.accessToken);
              localStorage.setItem('refreshToken', tokens.refreshToken);
              profileUser = await tryProfile(accessToken);
            }
          }
        } catch (error) {
          console.error('Failed to refresh tokens:', error);
        }
      }

      if (!profileUser) {
        // Tokens invalid or server logged out → clear client state
        setIsAuthenticated(false);
        setCurrentPage('login');
        setUser(null);
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        } catch (error) {
          console.error('Failed to clear local storage:', error);
        }
        return;
      }

      // Valid session
      const derivedName = profileUser.name || profileUser.email || 'User';
      setUser({ name: derivedName, avatarUrl: profileUser.avatarUrl });
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    };

    void validateTokens();
  }, [baseUrl]);

  const login = (incomingUser?: { name: string; avatarUrl?: string }) => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    const effectiveUser = incomingUser ?? { name: 'User' };
    setUser(effectiveUser);
    try {
      localStorage.setItem('user', JSON.stringify(effectiveUser));
    } catch (error) {
      console.error('Failed to set local storage:', error);
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
    } catch (error) {
      console.error('Failed to clear local storage:', error);
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
