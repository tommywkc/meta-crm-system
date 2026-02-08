import React from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
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
		case 'OUTSTANDING': return '欠款';
		default: return s || '-';
	}
};

const PaymentTable = ({ payments, onView, onProcess, showUserColumn = false }) => {
    const headers = [
        '建立日期',
        '訂單編號',
        showUserColumn ? '姓名 (用戶編號)' : null,
        '活動ID',
        '金額 (HKD)',
        '已付金額 (HKD)',
        '付款方式',
        '狀態',
        '付款期限',
        '操作'
    ].filter(Boolean);

	const renderCard = (p, idx) => {
		const userDisplay = p.user_name
			? `${p.user_name} (${p.user_id})`
			: '(Delected User)';

		return (
			<MobileCard
				key={`card-${p.payment_id || idx}`}
				actions={
					<>
						<button onClick={() => onView(p)}>查看</button>
						{showUserColumn && (p.status?.toUpperCase() == 'PENDING' || p.status?.toUpperCase() == 'OUTSTANDING') && (
							<button onClick={() => onProcess(p)}>付款</button>
						)}
						{showUserColumn && p.status?.toUpperCase() == 'COMPLETED' && (
							<button onClick={() => onProcess(p)} className="btn-danger">更改</button>
						)}
					</>
				}
			>
				<MobileCardRow label="建立日期" value={formatDateTimeForDisplay(p.paid_time || p.create_time)} />
				<MobileCardRow label="訂單編號" value={p.payment_id ?? '-'} valueStyle={{ wordBreak: 'break-all' }} />
				{showUserColumn && (
					<MobileCardRow label="用戶" value={userDisplay} />
				)}
				<MobileCardRow label="活動ID" value={p.event_id || '-'} />
				<MobileCardRow label="金額" value={currency.format(Number(p.amount || 0))} />
				<MobileCardRow label="已付金額" value={currency.format(Number((p.paid_amount ?? p.amount) || 0))} />
				<MobileCardRow label="付款方式" value={methodLabel(p.method)} />
				<MobileCardRow label="狀態" value={statusLabel(p.status)} />
				<MobileCardRow label="付款期限" value={p.expire_time ? formatDateTimeForDisplay(p.expire_time) : '-'} />
			</MobileCard>
		);
	};

	return (
		<CommonTable headers={headers} data={payments} emptyMessage="暫無付款紀錄" renderCard={renderCard}>
			{payments.map((p) => {
				// Display user as "Name (ID)"; if no name but has ID, show "(Deleted User) (ID)"; if neither, show '-'
				const userDisplay = p.user_name
					? `${p.user_name} (${p.user_id})`
					: '(Delected User)';
				return (
					<tr key={p.payment_id}>
						<td>{formatDateTimeForDisplay(p.paid_time || p.create_time)}</td>
						<td>{p.payment_id ?? '-'}</td>
						{showUserColumn && <td>{userDisplay}</td>}
						<td>{p.event_id || '-'}</td>
						<td>{currency.format(Number(p.amount || 0))}</td>
						<td>{currency.format(Number((p.paid_amount ?? p.amount) || 0))}</td>
						<td>{methodLabel(p.method)}</td>
						<td>{statusLabel(p.status)}</td>
						<td>{p.expire_time ? formatDateTimeForDisplay(p.expire_time) : '-'}</td>
						<td>
							
							<button onClick={() => onView(p)} style={{ marginRight: 8 }}>查看</button>

							{showUserColumn && (p.status?.toUpperCase() == 'PENDING' || p.status?.toUpperCase() == 'OUTSTANDING') && (
								<button onClick={() => onProcess(p)} style={{ marginRight: 8 }}>付款</button>
							)}
							{showUserColumn && p.status?.toUpperCase() == 'COMPLETED' && (
								<button onClick={() => onProcess(p)} className="btn-danger" style={{ marginRight: 8 }}>更改</button>
							)}
						</td>
					</tr>
				);
			})}
		</CommonTable>
	);
};

export default PaymentTable;
