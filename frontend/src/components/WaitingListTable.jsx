import React from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';

const WaitingListTable = ({ data = [], onApprove, onNotify, onReject }) => {
	const navigate = useNavigate();

	const normalized = (data || []).map((r, idx) => ({
		...r,
		_rank: r.rank ?? r.order ?? (idx + 1),
		user_id: r.user_id ?? r.customerId ?? r.id,
		name: r.name ?? r.customerName ?? '-',
		role: r.role ?? 'MEMBER',
		mobile: r.mobile ?? r.contact ?? '',
		email: r.email ?? '',
	}));

	const headers = ['排名', '用戶編號', '姓名', '角色', '電話', '電子郵件', '操作'];

	const renderCard = (row, idx) => (
		<MobileCard
			key={`card-${row.user_id || idx}`}
			actions={
				<>
					{onApprove ? <button onClick={() => onApprove(row)}>核准</button> : null}
					{onNotify ? <button onClick={() => onNotify(row)} style={{ marginLeft: 8 }}>通知</button> : null}
					{onReject ? <button onClick={() => onReject(row)} style={{ marginLeft: 8 }}>拒絕</button> : null}
					<button
						onClick={() => {
							if (!row.user_id) {
								alert('此候補沒有綁定客戶資料');
								return;
							}
							navigate(`/customers/${row.user_id}`);
						}}
						style={{ marginLeft: 8 }}
					>
						查看客戶
					</button>
				</>
			}
		>
			<MobileCardRow label="排名" value={row._rank || '-'} />
			<MobileCardRow label="用戶編號" value={row.user_id} />
			<MobileCardRow label="姓名" value={row.name} />
			<MobileCardRow label="角色" value={row.role} />
			<MobileCardRow label="電話" value={row.mobile} />
			<MobileCardRow label="電子郵件" valueStyle={{ wordBreak: 'break-all' }}>
				{row.email || '無'}
			</MobileCardRow>
		</MobileCard>
	);

	return (
		<CommonTable headers={headers} data={normalized} emptyMessage="暫無候補資料" renderCard={renderCard}>
			{normalized.map((row, idx) => (
				<tr key={row.user_id || idx}>
					<td>{row._rank || '-'}</td>
					<td>{row.user_id}</td>
					<td>{row.name}</td>
					<td>{row.role}</td>
					<td>{row.mobile}</td>
					<td>{row.email || '無'}</td>
					<td>
						{onApprove ? <button onClick={() => onApprove(row)}>核准</button> : null}
						{onNotify ? <button onClick={() => onNotify(row)} style={{ marginLeft: 8 }}>通知</button> : null}
						{onReject ? <button onClick={() => onReject(row)} style={{ marginLeft: 8 }}>拒絕</button> : null}
						<button
							onClick={() => {
								if (!row.user_id) {
									alert('此候補沒有綁定客戶資料');
									return;
								}
								navigate(`/customers/${row.user_id}`);
							}}
							style={{ marginLeft: 8 }}
						>
							查看客戶
						</button>
					</td>
				</tr>
			))}
		</CommonTable>
	);
};

export default WaitingListTable;
