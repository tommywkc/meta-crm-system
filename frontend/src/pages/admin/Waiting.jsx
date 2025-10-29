import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockWaiting = [
	{
		id: 'W1',
		customerId: 1,
		customerName: '陳小明',
		contact: '9123-4567',
		requestedClass: 'AI Animation 9A',
		requestedDate: '2025-11-12',
		seatsNeeded: 1,
		status: '候補',
		submittedAt: '2025-10-20 09:12'
	},
	{
		id: 'W2',
		customerId: null,
		customerName: '劉小姐（未記錄）',
		contact: '9876-0011',
		requestedClass: 'Seminar-SEP-03',
		requestedDate: '2025-09-03',
		seatsNeeded: 2,
		status: '已通知',
		submittedAt: '2025-10-22 14:30'
	}
];

const Waiting = () => {
	const navigate = useNavigate();

	const handleApprove = (row) => {
		alert(`模擬：已核准 ${row.id}（${row.customerName}）`);
	};
	const handleNotify = (row) => {
		alert(`模擬：已通知 ${row.contact}（${row.customerName}）`);
	};
	const handleReject = (row) => {
		const ok = window.confirm(`確定要拒絕候補 ${row.id} 嗎？`);
		if (ok) alert(`模擬：已拒絕 ${row.id}`);
	};
	const handleViewCustomer = (row) => {
		if (row.customerId) navigate(`/customers/${row.customerId}`);
		else alert('此候補沒有綁定客戶資料');
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>等待清單 (Admin)</h1>
			<p>查看候補名單、通知或核准候補客戶。</p>

			<table style={tableStyle}>
				<thead>
					<tr>
						<th style={thTdStyle}>候補編號</th>
						<th style={thTdStyle}>姓名 / 連絡</th>
						<th style={thTdStyle}>申請課堂</th>
						<th style={thTdStyle}>申請日期</th>
						<th style={thTdStyle}>人數</th>
						<th style={thTdStyle}>狀態</th>
						<th style={thTdStyle}>送出時間</th>
						<th style={thTdStyle}>動作</th>
					</tr>
				</thead>
				<tbody>
					{mockWaiting.map((r) => (
						<tr key={r.id}>
							<td style={thTdStyle}>{r.id}</td>
							<td style={thTdStyle}>
								<div style={{ fontWeight: 600 }}>{r.customerName}</div>
								<div style={{ fontSize: 12, color: '#666' }}>{r.contact}</div>
							</td>
							<td style={thTdStyle}>{r.requestedClass}</td>
							<td style={thTdStyle}>{r.requestedDate}</td>
							<td style={thTdStyle}>{r.seatsNeeded}</td>
							<td style={thTdStyle}>{r.status}</td>
							<td style={thTdStyle}>{r.submittedAt}</td>
							<td style={thTdStyle}>
								<button onClick={() => handleApprove(r)} style={{ marginRight: 8 }}>核准</button>
								<button onClick={() => handleNotify(r)} style={{ marginRight: 8 }}>通知</button>
								<button onClick={() => handleReject(r)} style={{ marginRight: 8 }}>拒絕</button>
								<button onClick={() => handleViewCustomer(r)}>查看客戶</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Waiting;
