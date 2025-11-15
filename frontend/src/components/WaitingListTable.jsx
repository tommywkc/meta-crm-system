import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tableStyle, thTdStyle } from '../styles/TableStyles';

const WaitingListTable = ({ data }) => {
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
		<table style={tableStyle}>
			<thead>
				<tr>
					<th style={thTdStyle}>候補編號</th>
					<th style={thTdStyle}>姓名</th>
					<th style={thTdStyle}>連絡電話</th>
					<th style={thTdStyle}>申請課堂</th>
					<th style={thTdStyle}>申請日期</th>
					<th style={thTdStyle}>課堂現在空位</th>
					<th style={thTdStyle}>送出時間</th>
					<th style={thTdStyle}>動作</th>
				</tr>
			</thead>
			<tbody>
				{data.map((r) => (
					<tr key={r.id}>
						<td style={thTdStyle}>{r.id}</td>
						<td style={thTdStyle}>{r.customerName}</td>
						<td style={thTdStyle}>{r.contact}</td>
						<td style={thTdStyle}>{r.requestedClass}</td>
						<td style={thTdStyle}>{r.requestedDate}</td>
						<td style={thTdStyle}>{r.currentSeats}</td>
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
	);
};

export default WaitingListTable;
