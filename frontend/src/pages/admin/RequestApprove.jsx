import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { handleGetRequestById, handleUpdateRequestById } from '../../api/requestsAPI';
import RequestViewTable from '../../components/RequestViewTable';
import { commonSelectStyle } from '../../styles/SelectStyles';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const RequestApprove = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [request, setRequest] = useState(location.state?.request || null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [decision, setDecision] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [rejectReason, setRejectReason] = useState('');
	const [customRejectReason, setCustomRejectReason] = useState('');
	const isPending = (request?.status || '').toString().toUpperCase() === 'PENDING';

	const handleConfirmDecision = () => {
		if (!isPending || !decision || !request?.request_id || submitting) return;
		if (decision === 'REJECTED') {
			const finalReason = rejectReason === '其他自訂' ? customRejectReason.trim() : rejectReason;
			if (!finalReason) {
				setError('請選擇或輸入拒絕原因');
				return;
			}
		}
		setSubmitting(true);
		setError('');
		setSuccessMessage('');
		const finalReason = decision === 'REJECTED'
			? (rejectReason === '其他自訂' ? customRejectReason.trim() : rejectReason)
			: null;
		handleUpdateRequestById(request.request_id, { status: decision, reject_reason: finalReason })
			.then(async (res) => {
				const updatedId = res?.request?.request_id || request.request_id;
				let latest = null;
				try {
					const detailRes = await handleGetRequestById(updatedId);
					latest = detailRes?.request || null;
				} catch (_) {}
				if (latest) {
					setRequest(latest);
				}
				setSuccessMessage('申請已更新');
				const nextRequest = latest || res?.request || request;
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
			if (!requestId) return;
			setLoading(true);
			setError('');
			try {
				const res = await handleGetRequestById(requestId);
				const found = res?.request || null;
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
	}, [requestId]);

	return (
		<PageContainer>
			<PageHeader 
				title="申請批核" 
				showBack={true} 
				onBack={() => navigate(-1)} 
			/>
			<p style={{ marginTop: -10, marginBottom: 20, color: '#6b7280' }}>檢視申請內容並選擇批核結果。</p>
			{/* Original Title Block Removed */}

			{loading && (
				<div style={{ marginTop: 16 }}>載入中…</div>
			)}

			{!loading && error && (
				<div style={{ marginTop: 16, color: '#b91c1c' }}>{error}</div>
			)}

			{!loading && successMessage && (
				<div style={{ marginTop: 16, color: '#15803d' }}>{successMessage}</div>
			)}

			{!loading && request && (
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
					style={{ ...commonSelectStyle, minWidth: 200 }}
				>
					<option value="">請選擇</option>
					<option value="APPROVED">批准</option>
					<option value="REJECTED">駁回</option>
				</select>
			</div>

			{isPending && decision === 'REJECTED' && (
				<div style={{ marginTop: 12 }}>
					<label htmlFor="request-reject-reason" style={{ display: 'block', marginBottom: 6 }}>
						拒絕原因
					</label>
					<select
						id="request-reject-reason"
						value={rejectReason}
						onChange={(event) => {
							setRejectReason(event.target.value);
							setCustomRejectReason('');
						}}
						style={{ ...commonSelectStyle, minWidth: 240 }}
					>
						<option value="">請選擇</option>
						<option value="不足3工作天">不足3工作天</option>
						<option value="已簽到不可改">已簽到不可改</option>
						<option value="時間衝突">時間衝突</option>
						<option value="剩餘名額0">剩餘名額0</option>
						<option value="資料不完整">資料不完整</option>
						<option value="規則不符">規則不符</option>
						<option value="其他自訂">其他自訂</option>
					</select>

					{rejectReason === '其他自訂' && (
						<input
							style={{ ...commonSelectStyle, marginTop: 8, minWidth: 240 }}
							placeholder="輸入自訂原因"
							value={customRejectReason}
							onChange={(event) => setCustomRejectReason(event.target.value)}
						/>
					)}
				</div>
			)}

			<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
				<button type="button" onClick={handleConfirmDecision} disabled={!isPending || !decision || submitting}>
					{isPending ? '確認批核' : '已批核'}
				</button>
			</div>
		</PageContainer>
	);
};

export default RequestApprove;
