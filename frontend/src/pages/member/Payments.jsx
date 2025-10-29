import React from 'react';

const mockPayments = [
	{
		id: 'P1001',
		date: '2025-10-01',
		order: 'ORD-20251001-01',
		item: 'AI Animation 9A（課堂費）',
		amount: 1200,
		method: '信用卡',
		status: '已付款'
	},
	{
		id: 'P1002',
		date: '2025-09-15',
		order: 'ORD-20250915-09',
		item: 'Seminar-SEP-03（講座票）',
		amount: 300,
		method: '轉帳',
		status: '已退款'
	}
];

const tableStyle = {
	width: '100%',
	borderCollapse: 'collapse',
	marginTop: 12
};

const thTdStyle = {
	border: '1px solid #ddd',
	padding: '8px',
	textAlign: 'left'
};

const Payments = () => {
	const onView = (p) => {
		alert(`查看收據（模擬）\n訂單：${p.order}\n金額：${p.amount}`);
	};
	const onDownload = (p) => {
		alert(`下載收據（模擬）: ${p.id}`);
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>付款紀錄(Member)</h1>


			<table style={tableStyle}>
				<thead>
					<tr>
						<th style={thTdStyle}>付款日期</th>
						<th style={thTdStyle}>訂單編號</th>
						<th style={thTdStyle}>項目</th>
						<th style={thTdStyle}>金額 (HKD)</th>
						<th style={thTdStyle}>付款方式</th>
						<th style={thTdStyle}>狀態</th>
						<th style={thTdStyle}>動作</th>
					</tr>
				</thead>
				<tbody>
					{mockPayments.map((p) => (
						<tr key={p.id}>
							<td style={thTdStyle}>{p.date}</td>
							<td style={thTdStyle}>{p.order}</td>
							<td style={thTdStyle}>{p.item}</td>
							<td style={thTdStyle}>{p.amount}</td>
							<td style={thTdStyle}>{p.method}</td>
							<td style={thTdStyle}>{p.status}</td>
							<td style={thTdStyle}>
								<button onClick={() => onView(p)} style={{ marginRight: 8 }}>查看</button>
								<button onClick={() => onDownload(p)}>下載</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Payments;
