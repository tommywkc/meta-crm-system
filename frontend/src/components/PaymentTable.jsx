import React from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';
import { useState, useMemo } from 'react';

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

	const [sortConfig, setSortConfig] = useState(null);
	const handleSort = (col) => setSortConfig((prev) => {
		if (!prev || prev.columnIndex !== col) return { columnIndex: col, direction: 'asc' };
		return { columnIndex: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
	});

	const sorted = useMemo(() => {
		if (!Array.isArray(payments)) return [];
		if (!sortConfig) return payments;
		const dir = sortConfig.direction === 'asc' ? 1 : -1;
		const cmp = (a, b) => {
			switch (sortConfig.columnIndex) {
				case 0: {
					const ta = a.paid_time || a.create_time ? new Date(a.paid_time || a.create_time).getTime() : 0;
					const tb = b.paid_time || b.create_time ? new Date(b.paid_time || b.create_time).getTime() : 0;
					return (ta - tb) * dir;
				}
				case 1: return String(a.payment_id ?? '').localeCompare(String(b.payment_id ?? '')) * dir;
				case 2: return String(a.user_name ? `${a.user_name} (${a.user_id})` : '(Deleted User)').localeCompare(String(b.user_name ? `${b.user_name} (${b.user_id})` : '(Deleted User)')) * dir;
				case 3: return String(a.event_id ?? '').localeCompare(String(b.event_id ?? '')) * dir;
				case 4: return (Number(a.amount || 0) - Number(b.amount || 0)) * dir;
				case 5: return (Number((a.paid_amount ?? a.amount) || 0) - Number((b.paid_amount ?? b.amount) || 0)) * dir;
				case 6: return String(methodLabel(a.method)).localeCompare(String(methodLabel(b.method))) * dir;
				case 7: return String(statusLabel(a.status)).localeCompare(String(statusLabel(b.status))) * dir;
				case 8: {
					const ta = a.expire_time ? new Date(a.expire_time).getTime() : 0;
					const tb = b.expire_time ? new Date(b.expire_time).getTime() : 0;
					return (ta - tb) * dir;
				}
				default: return 0;
			}
		};
		const cp = [...payments];
		cp.sort(cmp);
		return cp;
	}, [payments, sortConfig]);

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
		<CommonTable headers={headers} data={sorted} emptyMessage="暫無付款紀錄" onSort={handleSort} sortConfig={sortConfig} renderCard={renderCard}>
			{sorted.map((p) => {
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
