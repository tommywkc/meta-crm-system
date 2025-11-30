import React, { useEffect, useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { useAuth } from '../../contexts/AuthContext';
import { handleListPaymentByUserId } from '../../api/paymentAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const currency = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 });

const methodLabel = (m) => {
	switch ((m||'').toUpperCase()) {
		case 'CREDITCARD': return '信用卡';
		case 'FPS': return '轉數快';
		case 'PAYME': return 'PayMe';
		case 'CASH': return '現金';
		default: return m || '-';
	}
};

const statusLabel = (s) => {
	switch ((s||'').toUpperCase()) {
		case 'PENDING': return '待付款';
		case 'COMPLETED': return '已付款';
		case 'EXPIRED': return '已過期';
		default: return s || '-';
	}
};

const Payments = () => {
	const { user } = useAuth();
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const load = async () => {
			if (!user?.id) { setLoading(false); return; }
			try {
				const res = await handleListPaymentByUserId(user.id);
				// expect backend returns { payments: [...] } or just array
				const list = Array.isArray(res) ? res : (res.payments || []);
				setPayments(list);
			} catch (e) {
				setError(e?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [user?.id]);

	const onView = (p) => {
		alert(`查看收據（模擬）\n編號：${p.payment_id}\n金額：${currency.format(Number(p.amount||0))}`);
	};
	const onDownload = (p) => {
		alert(`下載收據（模擬）: ${p.receipt_number || '暫無'}`);
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>付款紀錄(Member)</h1>

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && (
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>建立日期</th>
							<th style={thTdStyle}>訂單編號</th>
							<th style={thTdStyle}>活動ID</th>
							<th style={thTdStyle}>金額 (HKD)</th>
							<th style={thTdStyle}>付款方式</th>
							<th style={thTdStyle}>狀態</th>
							<th style={thTdStyle}>付款期限</th>
							<th style={thTdStyle}>動作</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => (
							<tr key={p.payment_id}>
								<td style={thTdStyle}>{formatDateTimeForDisplay(p.paid_time || p.create_time)}</td>
								<td style={thTdStyle}>{p.payment_id ?? '-'}</td>
								<td style={thTdStyle}>{p.event_id || '-'}</td>
								<td style={thTdStyle}>{currency.format(Number(p.amount || 0))}</td>
								<td style={thTdStyle}>{methodLabel(p.method)}</td>
								<td style={thTdStyle}>{statusLabel(p.status)}</td>
								<td style={thTdStyle}>{p.expire_time ? formatDateTimeForDisplay(p.expire_time) : '-'}</td>
								<td style={thTdStyle}>
									<button onClick={() => onView(p)} style={{ marginRight: 8 }}>查看</button>
									<button onClick={() => onDownload(p)}>下載</button>
								</td>
							</tr>
						))}
						{payments.length === 0 && (
							<tr>
								<td style={thTdStyle} colSpan={8}>
									暫無付款紀錄
								</td>
							</tr>
						)}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default Payments;
