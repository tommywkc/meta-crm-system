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

const PaymentTable = ({ payments, onView, onProcess, showUserColumn = false, sortBy, sortOrder, onSort }) => {
    const renderSortIcon = (columnKey) => {
        if (sortBy !== columnKey) return <span style={{ color: '#ccc', marginLeft: 4 }}>↕</span>;
        return sortOrder === 'asc' ? <span style={{ marginLeft: 4 }}>↑</span> : <span style={{ marginLeft: 4 }}>↓</span>;
    };

    const headers = [
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('created_at')}>建立日期 {renderSortIcon('created_at')}</span>,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('payment_id')}>訂單編號 {renderSortIcon('payment_id')}</span>,
        showUserColumn ? <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('name')}>姓名 (用戶編號) {renderSortIcon('name')}</span> : null,
        showUserColumn ? <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('phone')}>電話 {renderSortIcon('phone')}</span> : null,
        showUserColumn ? <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('referrer')}>介紹人 {renderSortIcon('referrer')}</span> : null,
        showUserColumn ? <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('sales_rep')}>負責銷售 {renderSortIcon('sales_rep')}</span> : null,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('event_id')}>活動ID {renderSortIcon('event_id')}</span>,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('amount')}>金額 (HKD) {renderSortIcon('amount')}</span>,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('paid_amount')}>已付金額 (HKD) {renderSortIcon('paid_amount')}</span>,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('method')}>付款方式 {renderSortIcon('method')}</span>,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('status')}>狀態 {renderSortIcon('status')}</span>,
        <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('expire_time')}>付款期限 {renderSortIcon('expire_time')}</span>,
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
					<>
						<MobileCardRow label="用戶" value={userDisplay} />
						<MobileCardRow label="電話" value={p.user_mobile || '-'} />
						<MobileCardRow label="介紹人" value={p.user_referrer_name || '-'} />
						<MobileCardRow label="負責銷售" value={p.user_owner_sales_name || '-'} />
					</>
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
						{showUserColumn && (
							<>
								<td>{userDisplay}</td>
								<td>{p.user_mobile || '-'}</td>
								<td>{p.user_referrer_name || '-'}</td>
								<td>{p.user_owner_sales_name || '-'}</td>
							</>
						)}
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
