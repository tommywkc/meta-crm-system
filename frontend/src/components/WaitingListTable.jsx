import React from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable from './CommonTable';

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

    const headers = ['候補編號', '姓名', '連絡電話', '申請課堂', '申請日期', '課堂現在空位', '送出時間', '動作'];

	return (
		<CommonTable headers={headers}>
			{data.map((r) => (
				<tr key={r.id}>
					<td>{r.id}</td>
					<td>{r.customerName}</td>
					<td>{r.contact}</td>
					<td>{r.requestedClass}</td>
					<td>{r.requestedDate}</td>
					<td>{r.currentSeats}</td>
					<td>{r.submittedAt}</td>
					<td>
						<button onClick={() => handleApprove(r)} style={{ marginRight: 8 }}>核准</button>
						<button onClick={() => handleNotify(r)} style={{ marginRight: 8 }}>通知</button>
						<button onClick={() => handleReject(r)} style={{ marginRight: 8 }}>拒絕</button>
						<button onClick={() => handleViewCustomer(r)}>查看客戶</button>
					</td>
				</tr>
			))}
		</CommonTable>
	);
};

export default WaitingListTable;
