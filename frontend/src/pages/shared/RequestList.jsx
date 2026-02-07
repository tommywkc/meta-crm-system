import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestsTable from '../../components/RequestsListTable';
import { handleListRequests } from '../../api/requestsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const RequestList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const normalizedRole = (user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await handleListRequests();
      setRequests(res?.requests || []);
    } catch (err) {
      setError(err?.message || '無法載入申請列表');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = useCallback((req) => {
    if (!req?.request_id) return;
    navigate(`/admin/requests/${req.request_id}/approve`, { state: { request: req } });
  }, [navigate]);

  return (
    <PageContainer>
      <PageHeader title="申請列表" />

      {error && (
        <div style={{ color: '#b91c1c', marginTop: 12 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <RequestsTable requests={requests} loading={loading} onApprove={handleApprove} />
      </div>
    </PageContainer>
  );
};

export default RequestList;