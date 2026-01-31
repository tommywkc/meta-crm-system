import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleListRequests } from '../../api/requestsAPI';
import RequestViewTable from '../../components/RequestViewTable';

const RequestView = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [request, setRequest] = useState(location.state?.request || null);
	const [loading, setLoading] = useState(!location.state?.request);
	const [error, setError] = useState('');

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
					<h1 style={{ marginBottom: 4 }}>申請詳情</h1>
					<p style={{ margin: 0, color: '#6b7280' }}>檢視申請的所有欄位資訊。</p>
				</div>
				<button type="button" onClick={() => navigate(-1)}>返回上一頁</button>
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
		</div>
	);
};

export default RequestView;
