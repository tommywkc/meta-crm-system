import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/shared/LoginPage';
import MemberPage from './pages/member/MemberPage';
import SalesPage from './pages/sales/SalesPage';
import AdminPage from './pages/admin/AdminPage';
import Header from './components/Header';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminScan from './pages/admin/AdminScan';
import AdminEvents from './pages/admin/AdminEvents';
import AdminDownload from './pages/admin/AdminDownload';
import AdminReports from './pages/admin/AdminReports';
import Notifications from './pages/shared/Notifications';
import AdminWaiting from './pages/admin/AdminWaiting';
import AdminFiles from './pages/admin/AdminFiles';

import SalesCustomers from './pages/sales/SalesCustomers';
import SalesKPI from './pages/sales/SalesKPI';

import MemberPayments from './pages/member/MemberPayments';
import MemberReceipts from './pages/member/MemberReceipts';
import MemberRequests from './pages/member/MemberRequests';
import MemberHomework from './pages/member/MemberHomework';

// 確保ProtectedRoute組件在AuthProvider內部
const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user, loading } = useAuth();
  // 如果還在初始化（從 /api/me 還沒回來），顯示 loading 避免閃爍
  if (loading) return <div style={{ padding: 20 }}>載入中…</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // support allowedRole (string) or allowedRoles (array)
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" />;
  }
  if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
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
          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['admin','sales']}>
              <AdminCustomers />
            </ProtectedRoute>
          } />
          <Route path="/approvals" element={
            <ProtectedRoute allowedRole="admin">
              <AdminApprovals />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute allowedRole="admin">
              <AdminScan />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute allowedRole="admin">
              <AdminEvents />
            </ProtectedRoute>
          } />
          <Route path="/download" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDownload />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRole="admin">
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={["admin","sales","member"]}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/waiting" element={
            <ProtectedRoute allowedRole="admin">
              <AdminWaiting />
            </ProtectedRoute>
          } />
          <Route path="/files" element={
            <ProtectedRoute allowedRole="admin">
              <AdminFiles />
            </ProtectedRoute>
          } />

          <Route path="/sales-kpi" element={
            <ProtectedRoute allowedRole="sales">
              <SalesKPI />
            </ProtectedRoute>
          } />
          <Route path="/sales-customers" element={
            <ProtectedRoute allowedRole="sales">
              <SalesCustomers />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRole="member">
              <MemberPayments />
            </ProtectedRoute>
          } />
          <Route path="/receipts" element={
            <ProtectedRoute allowedRole="member">
              <MemberReceipts />
            </ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute allowedRole="member">
              <MemberRequests />
            </ProtectedRoute>
          } />
          <Route path="/homework" element={
            <ProtectedRoute allowedRole="member">
              <MemberHomework />
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