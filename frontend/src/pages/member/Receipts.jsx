import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../api/apiBase';
import { handleListMyReceiptFiles } from '../../api/receiptsAPI';
import { handleListMyCertificateFiles } from '../../api/certificatesAPI';
import { handleListPaymentByUserId } from '../../api/paymentAPI';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { useAuth } from '../../contexts/AuthContext';
import CommonTable from '../../components/CommonTable';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const Receipts = () => {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [receipts, setReceipts] = useState([]);
	const [certificates, setCertificates] = useState([]);
	const [eventMap, setEventMap] = useState({});

	useEffect(() => {
		const fetchData = async () => {
			if (!user?.id) return;
			setLoading(true);
			setError(null);
			try {
				const paymentsRes = await handleListPaymentByUserId(user.id, { status: 'COMPLETED' });
				const payments = paymentsRes.payments || [];
				const map = {};
				payments.forEach((p) => {
					if (p.event_id) {
						map[String(p.event_id)] = p.event_name || `活動 ${p.event_id}`;
					}
				});
				setEventMap(map);

				const [receiptRes, certRes] = await Promise.all([
					handleListMyReceiptFiles(),
					handleListMyCertificateFiles()
				]);

				const receiptFiles = receiptRes.files || [];
				const certificateFiles = certRes.files || [];
				setReceipts(receiptFiles);
				setCertificates(certificateFiles);

				const eventIds = Array.from(new Set(
					[...receiptFiles, ...certificateFiles]
						.map((f) => f.eventId)
						.filter(Boolean)
						.map((id) => String(id))
				));

				const missingIds = eventIds.filter((id) => !map[id]);
				if (missingIds.length > 0) {
					const fetches = await Promise.all(
						missingIds.map(async (id) => {
							try {
								const res = await handleGetEventById(id);
								return { id, name: res?.event?.event_name || `活動 ${id}` };
							} catch (e) {
								return null;
							}
						})
					);
					const nextMap = { ...map };
					fetches.filter(Boolean).forEach((item) => {
						nextMap[item.id] = item.name;
					});
					setEventMap(nextMap);
				}
			} catch (err) {
				setError(err?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user?.id]);

	const receiptItems = useMemo(() => (
		receipts.map((f) => ({
			...f,
			type: '收據'
		}))
	), [receipts]);

	const certificateItems = useMemo(() => (
		certificates.map((f) => ({
			...f,
			type: '證書'
		}))
	), [certificates]);

	const formatEventName = (eventId) => {
		if (!eventId) return '未知活動';
		return eventMap[String(eventId)] || `活動 ${eventId}`;
	};

	const formatUploadTime = (isoString) => {
		if (!isoString) return '—';
		const d = new Date(isoString);
		if (Number.isNaN(d.getTime())) return isoString;
		const dd = String(d.getDate()).padStart(2, '0');
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const yyyy = d.getFullYear();
		const hh = String(d.getHours()).padStart(2, '0');
		const min = String(d.getMinutes()).padStart(2, '0');
		return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
	};

	const handleDownload = (type, fileName) => {
		const url = type === '收據'
			? apiUrl(`/api/receipts/download?fileName=${encodeURIComponent(fileName)}`)
			: apiUrl(`/api/certificates/download?fileName=${encodeURIComponent(fileName)}`);
		const link = document.createElement('a');
		link.href = url;
		link.rel = 'noopener';
		link.download = '';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const renderSection = (title, items) => {
		const headers = ['活動名稱', '類型', '檔案名稱', '上傳時間', '操作'];
		return (
			<div style={{ marginBottom: 24 }}>
				<h2 style={{ marginBottom: 8 }}>{title}</h2>
				<CommonTable headers={headers} data={items} emptyMessage="暫時未有可下載檔案">
					{items.map((item, idx) => (
						<tr key={`${title}-${idx}`}>
							<td>{formatEventName(item.eventId)}</td>
							<td>{item.type}</td>
							<td>{item.originalName || item.fileName}</td>
							<td>{formatUploadTime(item.uploadDate)}</td>
							<td>
								<button onClick={() => handleDownload(item.type, item.fileName)}>
									下載
								</button>
							</td>
						</tr>
					))}
				</CommonTable>
			</div>
		);
	};

	return (
		<PageContainer>
			<PageHeader title="收據與證書下載 (Member)" />
			<p>你可以查看並下載自己已發放的收據與證書。</p>

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && (
				<>
					{renderSection('我的收據', receiptItems)}
					{renderSection('我的證書', certificateItems)}
				</>
			)}
		</PageContainer>
	);
};

export default Receipts;
