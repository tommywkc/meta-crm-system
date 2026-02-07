import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleListRequests } from '../../api/requestsAPI';
import { useAuth } from '../../contexts/AuthContext';
import RequestViewTable from '../../components/RequestViewTable';

const RequestView = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();
	const isAdmin = (user?.role || '').toLowerCase() === 'admin';
	const [request, setRequest] = useState(location.state?.request || null);
	const [loading, setLoading] = useState(!location.state?.request);
	const [error, setError] = useState('');
	const isPending = (request?.status || '').toString().toUpperCase() === 'PENDING';


    
	useEffect(() => {
		const loadRequest = async () => {
			if (request) return;
			if (!requestId) return;
			setLoading(true);
			setError('');
			try {
				const res = await handleListRequests();
				const found = (res?.requests || []).find((item) => String(item.request_id) === String(requestId));
				if (!found) {
					setError('找不到申請資料');
				}
				setRequest(found || null);
			} catch (err) {
				setError(err?.message || '無法載入申請詳情');
			} finally {
				setLoading(false);
			}
		};

		loadRequest();
	}, [request, requestId]);

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
				<div>
					<h2 style={{ marginBottom: 4 }}>申請詳情</h2>
					<p style={{ margin: 0, color: '#6b7280' }}>檢視申請的所有欄位資訊。</p>
				</div>
			</div>

			{loading && (
				<div style={{ marginTop: 16 }}>載入中…</div>
			)}

			{!loading && error && (
				<div style={{ marginTop: 16, color: '#b91c1c' }}>{error}</div>
			)}

			{!loading && !error && request && (
				<div style={{ marginTop: 16 }}>
					<RequestViewTable request={request} />
				</div>
			)}
			<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
				{isAdmin && (
					<button
						type="button"
						onClick={() => navigate(`/admin/requests/${request?.request_id}/approve`, { state: { request } })}
						disabled={!request || !isPending}
					>
						{isPending ? '批核' : '已批核'}
					</button>
				)}
                <button type="button" onClick={() => navigate('/admin/requests')}>返回列表</button>
			</div>
		</div>
	);
};

export default RequestView;
