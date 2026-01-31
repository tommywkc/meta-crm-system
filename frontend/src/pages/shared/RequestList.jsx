import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestsTable from '../../components/RequestsListTable';
import { handleListRequests } from '../../api/requestsAPI';
import { useAuth } from '../../contexts/AuthContext';

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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>申請列表</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>檢視與追蹤全部會員提出的申請狀態。</p>
        </div>
        {!isAdmin && (
          <button type="button" onClick={() => navigate(-1)}>
            返回上一頁
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#b91c1c', marginTop: 12 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <RequestsTable requests={requests} loading={loading} onApprove={handleApprove} />
      </div>
    </div>
  );
};

export default RequestList;