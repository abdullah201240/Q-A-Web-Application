import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import { SignupOptions } from "./components/SignupOptions";
import { Dashboard } from "./components/Dashboard";

// Define children prop interface for ProtectedRoute
interface ProtectedRouteProps {
  children: React.ReactElement;
}

// Protected Route component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupOptions />
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
    </Router>
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