import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardContentView from './pages/dashboard/DashboardContentView';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardContentView />} />
            <Route path="personal" element={<DashboardContentView />} />
            <Route path="work" element={<DashboardContentView />} />
            <Route path="collab" element={<DashboardContentView />} />
            <Route path="routine" element={<DashboardContentView />} />
            <Route path="plan" element={<DashboardContentView />} />
            <Route path="vault" element={<DashboardContentView />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
