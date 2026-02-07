import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleListRequests, handleUpdateRequestById } from '../../api/requestsAPI';
import RequestViewTable from '../../components/RequestViewTable';

const RequestApprove = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [request, setRequest] = useState(location.state?.request || null);
	const [loading, setLoading] = useState(!location.state?.request);
	const [error, setError] = useState('');
	const [decision, setDecision] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const isPending = (request?.status || '').toString().toUpperCase() === 'PENDING';

	const handleConfirmDecision = () => {
		if (!isPending || !decision || !request?.request_id || submitting) return;
		setSubmitting(true);
		setError('');
		setSuccessMessage('');
		handleUpdateRequestById(request.request_id, { status: decision })
			.then(async (res) => {
				const updatedId = res?.request?.request_id || request.request_id;
				const listRes = await handleListRequests();
				const enriched = (listRes?.requests || []).find((item) => String(item.request_id) === String(updatedId));
				if (enriched) {
					setRequest(enriched);
				}
				setSuccessMessage('申請已更新');
				const nextRequest = enriched || res?.request || request;
				if (nextRequest?.request_id) {
					navigate(`/requests/${nextRequest.request_id}`, { state: { request: nextRequest } });
				}
			})
			.catch((err) => {
				setError(err?.message || '更新申請失敗');
			})
			.finally(() => {
				setSubmitting(false);
			});
	};

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
					<h2 style={{ marginBottom: 4 }}>申請批核</h2>
					<p style={{ margin: 0, color: '#6b7280' }}>檢視申請內容並選擇批核結果。</p>
				</div>
			</div>

			{loading && (
				<div style={{ marginTop: 16 }}>載入中…</div>
			)}

			{!loading && error && (
				<div style={{ marginTop: 16, color: '#b91c1c' }}>{error}</div>
			)}

			{!loading && successMessage && (
				<div style={{ marginTop: 16, color: '#15803d' }}>{successMessage}</div>
			)}

			{!loading && !error && request && (
				<div style={{ marginTop: 16 }}>
					<RequestViewTable request={request} />
				</div>
			)}

			<div style={{ marginTop: 16 }}>
				<label htmlFor="request-decision" style={{ display: 'block', marginBottom: 6 }}>
					批核結果
				</label>
				<select
					id="request-decision"
					value={decision}
					onChange={(event) => setDecision(event.target.value)}
					disabled={!isPending}
					style={{ minWidth: 200, padding: '6px 8px' }}
				>
					<option value="">請選擇</option>
					<option value="APPROVED">批准</option>
					<option value="REJECTED">駁回</option>
				</select>
			</div>

			<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
				<button type="button" onClick={handleConfirmDecision} disabled={!isPending || !decision || submitting}>
					{isPending ? '確認批核' : '已批核'}
				</button>
                <button type="button" onClick={() => navigate('/admin/requests')}>返回列表</button>
			</div>
		</div>
	);
};

export default RequestApprove;
