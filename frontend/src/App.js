import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/shared/LoginPage';
import HomePage from './pages/shared/Page';
import Header from './components/Header';
import CustomersList from './pages/shared/CustomersList';
import CustomerView from './pages/shared/CustomerView';
import CustomerEdit from './pages/admin/CustomerEdit';
import CustomerCreate from './pages/admin/CustomerCreate';
import Scan from './pages/admin/Scan';
import EventList from './pages/shared/EventList';
import EventCreate from './pages/admin/EventCreate';
import EventsEdit from './pages/admin/EventsEdit';
import SessionEdit from './pages/admin/SessionEdit';
import SessionCreate from './pages/admin/SessionCreate';
import EventImport from './pages/admin/EventImport';
import ImportHistory from './pages/admin/ImportHistory';
import EventView from './pages/shared/EventView';
import Reports from './pages/admin/Reports';
import Notifications from './pages/shared/Notifications';
import Waiting from './pages/admin/Waiting';
import KPIAdmin from './pages/admin/KPIAdmin';

// SalesCustomers removed in favor of shared CustomersList
import KPI from './pages/sales/KPI';

import Payments from './pages/shared/Payments';
import PaymentProcess from './pages/shared/PaymentProcess';
import PaymentView from './pages/shared/PaymentView';
import Receipts from './pages/member/Receipts';
import RequestSelection from './pages/shared/RequestSelection';
import MyQRcode from './pages/member/MyQRcode';
import Apply from './pages/shared/Apply';
import MyEventList from './pages/member/MyEventList';
import EnrollSession from './pages/shared/EnrollSession';
import SessionListPage from './pages/shared/sessionList';
import Feedback from './pages/shared/Feedback';
import FeedbackListPage from './pages/admin/FeedbackListPage';
import EnrolledList from './pages/shared/EnrolledList';
import EventHomework from './pages/shared/EventHomework';
import EventHomeworkCreate from './pages/admin/EventHomeworkCreate';
import EventHomeworkEdit from './pages/admin/EventHomeworkEdit';
import EventHomeworkView from './pages/shared/EventHomeworkView';
import EventHomeworkResult from './pages/shared/EventHomeworkResult';
import EventHomeworkGrade from './pages/admin/EventHomeworkGrade';
import RequestList from './pages/shared/RequestList';
import RequestView from './pages/shared/RequestView';
import RequestApprove from './pages/admin/RequestApprove';


const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // support allowedRole (string) or allowedRoles (array)
  // Case-insensitive role comparison
  if (allowedRole && user.role?.toLowerCase() !== allowedRole.toLowerCase()) {
    return <Navigate to="/login" />;
  }
  if (Array.isArray(allowedRoles) && !allowedRoles.some(role => role.toLowerCase() === user.role?.toLowerCase())) {
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
            <ProtectedRoute allowedRoles={['admin','sales','leader']}>
              <CustomersList />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute allowedRoles={['admin','sales','leader']}>
              <CustomerView />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id/edit" element={
            <ProtectedRoute allowedRole={'admin'}>
              <CustomerEdit />
            </ProtectedRoute>
          } />
          <Route path="/customers/create" element={
            <ProtectedRoute allowedRole={'admin'}>
              <CustomerCreate />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute allowedRole="admin">
              <Scan />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader","member"]}>
              <EventList />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader","member"]}>
              <EventView />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/enrolled" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader"]}>
              <EnrolledList />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/homework" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader","member"]}>
              <EventHomework />
            </ProtectedRoute>
          } />
          <Route path="/admin/events/:id/homework/create" element={
            <ProtectedRoute allowedRole="admin">
              <EventHomeworkCreate />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/homework/:assignmentId" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader"]}>
              <EventHomeworkView />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/homework/:assignmentId/result" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader","member"]}>
              <EventHomeworkResult />
            </ProtectedRoute>
          } />
          <Route path="/admin/events/:id/homework/:assignmentId/grade/:userId" element={
            <ProtectedRoute allowedRole="admin">
              <EventHomeworkGrade />
            </ProtectedRoute>
          } />
          <Route path="/admin/events/:id/homework/:assignmentId/edit" element={
            <ProtectedRoute allowedRole="admin">
              <EventHomeworkEdit />
            </ProtectedRoute>
          } />
          <Route path="/sessions/:sessionId/enrolled" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader"]}>
              <EnrolledList />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/apply" element={
            <ProtectedRoute allowedRoles={["member","sales","leader"]}>
              <Apply />
            </ProtectedRoute>
          } />
          <Route path="/events/create" element={
            <ProtectedRoute allowedRole="admin">
              <EventCreate />
            </ProtectedRoute>
          } />
          <Route path="/events/import" element={
            <ProtectedRoute allowedRole="admin">
              <EventImport />
            </ProtectedRoute>
          } />
          <Route path="/events/import-history" element={
            <ProtectedRoute allowedRole="admin">
              <ImportHistory />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/edit" element={
            <ProtectedRoute allowedRole="admin">
              <EventsEdit />
            </ProtectedRoute>
          } />
          <Route path="/events/:eventId/sessions/create" element={
            <ProtectedRoute allowedRole="admin">
              <SessionCreate />
            </ProtectedRoute>
          } />
          <Route path="/sessions/:id/edit" element={
            <ProtectedRoute allowedRole="admin">
              <SessionEdit />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRole="admin">
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={["admin","sales","member","leader"]}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/waiting" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader"]}>
              <Waiting />
            </ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute allowedRole="admin">
              <RequestList />
            </ProtectedRoute>
          } />
          <Route path="/admin/requests/:requestId/approve" element={
            <ProtectedRoute allowedRole="admin">
              <RequestApprove />
            </ProtectedRoute>
          } />
          <Route path="/requests/history" element={
            <ProtectedRoute allowedRoles={["admin","member","sales","leader"]}>
              <RequestList />
            </ProtectedRoute>
          } />
          <Route path="/requests/:requestId" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader","member"]}>
              <RequestView />
            </ProtectedRoute>
          } />

          <Route path="/sales-kpi" element={
            <ProtectedRoute allowedRoles={["sales","leader"]}>
              <KPI />
            </ProtectedRoute>
          } />
          <Route path="/admin-kpi" element={
            <ProtectedRoute allowedRole="admin">
              <KPIAdmin />
            </ProtectedRoute>
          } />
          <Route path="/sales-customers" element={
            <ProtectedRoute allowedRole="sales">
              <CustomersList />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'leader', 'member']}>
              <Payments />
            </ProtectedRoute>
          } />
          <Route path="/payments/:paymentId" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'leader', 'member']}>
              <PaymentView />
            </ProtectedRoute>
          } />
          <Route path="/payments/:paymentId/process" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'leader']}>
              <PaymentProcess />
            </ProtectedRoute>
          } />
          {/* 場次報名頁面：從 EventView 場次列表點擊「報名」而來 */}
          <Route path="/events/:id/enrollsession" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'leader', 'member']}>
              <EnrollSession />
            </ProtectedRoute>
          } />
          {/* 保留舊路徑以避免已有連結壞掉 */}
          <Route path="/enrollsession" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'leader', 'member']}>
              <EnrollSession />
            </ProtectedRoute>
          } />
          <Route path="/receipts" element={
            <ProtectedRoute allowedRole="member">
              <Receipts />
            </ProtectedRoute>
          } />
          <Route path="/requests/select" element={
            <ProtectedRoute allowedRoles={["member","sales","leader"]}>
              <RequestSelection />
            </ProtectedRoute>
          } />
          <Route path="/myqrcode" element={
            <ProtectedRoute allowedRole="member">
              <MyQRcode />
            </ProtectedRoute>
          } />
          <Route path="/myevents" element={
            <ProtectedRoute allowedRole="member">
              <MyEventList />
            </ProtectedRoute>
          } />
          <Route path="/sessions/enrolled" element={
            <ProtectedRoute allowedRoles={["admin","sales","leader","member"]}>
              <SessionListPage />
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'leader', 'member']}>
              <Feedback />
            </ProtectedRoute>
          } />
          <Route path="/admin/feedbacks" element={
            <ProtectedRoute allowedRole="admin">
              <FeedbackListPage />
            </ProtectedRoute>
          } />
          <Route 
            path="/member" 
            element={
              <ProtectedRoute allowedRole="member">
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute allowedRoles={["sales", "leader"]}>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <HomePage />
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