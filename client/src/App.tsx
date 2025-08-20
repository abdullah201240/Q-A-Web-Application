import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import { Dashboard } from "./components/Dashboard";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <LoginPage 
            onSignupClick={() => navigate('/signup')}
            onLoginSuccess={() => { navigate('/dashboard'); }}
          />
      } />
      <Route path="/signup" element={
        isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <SignupPage 
            onSignupSuccess={() => { navigate('/dashboard'); }}
            onLoginClick={() => navigate('/login')}
          />
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}