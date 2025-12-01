import React from 'react';
import { tableStyle, thTdStyle, redTextStyle, greenTextStyle } from '../styles/TableStyles';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

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
        case 'CANCELLED': return '已取消';
        case 'REFUNDED': return '已退款';
		default: return s || '-';
	}
};

const PaymentTable = ({ payments, onView, onDownload, onProcess, showUserColumn = false }) => {
	return (
		<table style={tableStyle}>
			<thead>
				<tr>
					<th style={thTdStyle}>建立日期</th>
					<th style={thTdStyle}>訂單編號</th>
					{showUserColumn && <th style={thTdStyle}>姓名 (用戶編號)</th>}
					<th style={thTdStyle}>活動ID</th>
					<th style={thTdStyle}>金額 (HKD)</th>
					<th style={thTdStyle}>付款方式</th>
					<th style={thTdStyle}>狀態</th>
					<th style={thTdStyle}>付款期限</th>
					<th style={thTdStyle}>動作</th>
				</tr>
			</thead>
			<tbody>
				{payments.map((p) => {
					const userDisplay = p.user_name 
						? `${p.user_name} (${p.user_id})` 
						: (p.user_id || '-');
					return (
						<tr key={p.payment_id}>
							<td style={thTdStyle}>{formatDateTimeForDisplay(p.paid_time || p.create_time)}</td>
							<td style={thTdStyle}>{p.payment_id ?? '-'}</td>
							{showUserColumn && <td style={thTdStyle}>{userDisplay}</td>}
							<td style={thTdStyle}>{p.event_id || '-'}</td>
							<td style={thTdStyle}>{currency.format(Number(p.amount || 0))}</td>
							<td style={thTdStyle}>{methodLabel(p.method)}</td>
							<td style={thTdStyle}>{statusLabel(p.status)}</td>
							<td style={thTdStyle}>{p.expire_time ? formatDateTimeForDisplay(p.expire_time) : '-'}</td>
							<td style={thTdStyle}>
                                
								<button onClick={() => onView(p)} style={{ marginRight: 8 }}>查看</button>
								<button onClick={() => onDownload(p)}>下載</button>
                                
                                {showUserColumn && p.status?.toUpperCase() == 'PENDING' && (
									<button onClick={() => onProcess(p)} style={{ ...greenTextStyle }}>付款</button>
								)}
                                {showUserColumn && p.status?.toUpperCase() == 'COMPLETED' && (
									<button onClick={() => onProcess(p)} style={{ ...redTextStyle }}>更改</button>
								)}
							</td>
						</tr>
					);
				})}
				{payments.length === 0 && (
					<tr>
						<td style={thTdStyle} colSpan={showUserColumn ? 9 : 8}>
							暫無付款紀錄
						</td>
					</tr>
				)}
			</tbody>
		</table>
	);
};

export default PaymentTable;
