import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MemberPage from './pages/MemberPage';
import SalesPage from './pages/SalesPage';
import AdminPage from './pages/AdminPage';

// 確保ProtectedRoute組件在AuthProvider內部
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  console.log('ProtectedRoute檢查:', user, allowedRole);
  
  if (!user) {
    console.log('用戶未登入，重定向到登入頁');
    return <Navigate to="/login" />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    console.log('角色不匹配，重定向到登入頁');
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/member" 
            element={
              <ProtectedRoute allowedRole="member">
                <MemberPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute allowedRole="sales">
                <SalesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;