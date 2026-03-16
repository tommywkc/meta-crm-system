import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RequestsTable from '../../components/RequestsListTable';
import { handleListRequests } from '../../api/requestsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const RequestList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const normalizedRole = (user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isHistoryView = location.pathname === '/requests/history';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await handleListRequests();
      const list = res?.requests || [];
      const pendingOnly = list.filter((req) => (req?.status || '').toString().toUpperCase() === 'PENDING');
      setRequests(isHistoryView ? list : pendingOnly);
    } catch (err) {
      setError(err?.message || '無法載入申請列表');
    } finally {
      setLoading(false);
    }
  }, [isHistoryView]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = useCallback((req) => {
    if (!req?.request_id) return;
    navigate(`/admin/requests/${req.request_id}/approve`, { state: { request: req } });
  }, [navigate]);

  return (
    <PageContainer>
      <PageHeader
        title={isHistoryView ? '申請紀錄' : '申請列表'}
        extra={!isHistoryView ? (
          <button onClick={() => navigate('/requests/history')} style={{ minWidth: 140 }}>
            查看申請紀錄
          </button>
        ) : null}
      />

      {error && (
        <div style={{ color: '#b91c1c', marginTop: 12 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <RequestsTable requests={requests} loading={loading} onApprove={handleApprove} isHistoryView={isHistoryView} />
      </div>
    </PageContainer>
  );
};

export default RequestList;