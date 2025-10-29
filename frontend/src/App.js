import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/shared/LoginPage';
import MemberPage from './pages/member/Page';
import SalesPage from './pages/sales/Page';
import AdminPage from './pages/admin/Page';
import Header from './components/Header';
import CustomersList from './pages/shared/CustomersList';
import CustomerView from './pages/shared/CustomerView';
import CustomerEdit from './pages/admin/CustomerEdit';
import Approvals from './pages/admin/Approvals';
import Scan from './pages/admin/Scan';
import Events from './pages/admin/Events';
import EventsEdit from './pages/admin/EventsEdit';
import Download from './pages/admin/Download';
import Reports from './pages/admin/Reports';
import Notifications from './pages/shared/Notifications';
import Waiting from './pages/admin/Waiting';
import Files from './pages/admin/Files';

// SalesCustomers removed in favor of shared CustomersList
import KPI from './pages/sales/KPI';

import Payments from './pages/member/Payments';
import Receipts from './pages/member/Receipts';
import Requests from './pages/member/Requests';
import RequestsForm from './pages/member/RequestsForm';
import Homework from './pages/member/Homework';

const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

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
              <CustomersList />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute allowedRoles={['admin','sales']}>
              <CustomerView />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id/edit" element={
            <ProtectedRoute allowedRole={'admin'}>
              <CustomerEdit />
            </ProtectedRoute>
          } />
          <Route path="/approvals" element={
            <ProtectedRoute allowedRole="admin">
              <Approvals />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute allowedRole="admin">
              <Scan />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute allowedRole="admin">
              <Events />
            </ProtectedRoute>
          } />
          <Route path="/events/create" element={
            <ProtectedRoute allowedRole="admin">
              <EventsEdit />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/edit" element={
            <ProtectedRoute allowedRole="admin">
              <EventsEdit />
            </ProtectedRoute>
          } />
          <Route path="/download" element={
            <ProtectedRoute allowedRole="admin">
              <Download />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRole="admin">
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={["admin","sales","member"]}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/waiting" element={
            <ProtectedRoute allowedRole="admin">
              <Waiting />
            </ProtectedRoute>
          } />
          <Route path="/files" element={
            <ProtectedRoute allowedRole="admin">
              <Files />
            </ProtectedRoute>
          } />

          <Route path="/sales-kpi" element={
            <ProtectedRoute allowedRole="sales">
              <KPI />
            </ProtectedRoute>
          } />
          <Route path="/sales-customers" element={
            <ProtectedRoute allowedRole="sales">
              <CustomersList />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRole="member">
              <Payments />
            </ProtectedRoute>
          } />
          <Route path="/receipts" element={
            <ProtectedRoute allowedRole="member">
              <Receipts />
            </ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute allowedRole="member">
              <Requests />
            </ProtectedRoute>
          } />
          <Route path="/requests/create" element={
            <ProtectedRoute allowedRole="member">
              <RequestsForm />
            </ProtectedRoute>
          } />
          <Route path="/homework" element={
            <ProtectedRoute allowedRole="member">
              <Homework />
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