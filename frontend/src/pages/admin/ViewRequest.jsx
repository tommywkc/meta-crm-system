import React, { useEffect, useState, useCallback } from 'react';
import RequestsTable from '../../components/RequestsTable';
import { handleListRequests } from '../../api/requestsAPI';

const ViewRequest = () => {
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

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
				<div>
					<h1 style={{ marginBottom: 4 }}>申請列表</h1>
					<p style={{ margin: 0, color: '#6b7280' }}>檢視與追蹤全部會員提出的申請狀態。</p>
				</div>
				<button onClick={loadRequests} disabled={loading}>
					{loading ? '重新整理中…' : '重新整理'}
				</button>
			</div>

			{error && (
				<div style={{ color: '#b91c1c', marginTop: 12 }}>
					{error}
				</div>
			)}

			<div style={{ marginTop: 16 }}>
				<RequestsTable requests={requests} loading={loading} />
			</div>
		</div>
	);
};

export default ViewRequest;
