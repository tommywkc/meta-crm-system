import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MemberPage from './pages/MemberPage';
import SalesPage from './pages/SalesPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import PageA from './pages/PageA';
import PageB from './pages/PageB';
import PageC from './pages/PageC';

// 確保ProtectedRoute組件在AuthProvider內部
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  // 如果還在初始化（從 /api/me 還沒回來），顯示 loading 避免閃爍
  if (loading) return <div style={{ padding: 20 }}>載入中…</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/a" element={
            <ProtectedRoute>
              <PageA />
            </ProtectedRoute>
          } />
          <Route path="/b" element={
            <ProtectedRoute>
              <PageB />
            </ProtectedRoute>
          } />
          <Route path="/c" element={
            <ProtectedRoute>
              <PageC />
            </ProtectedRoute>
          } />
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