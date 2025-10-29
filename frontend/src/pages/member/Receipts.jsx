import React from 'react';

const mockReceipts = [
	{
		id: 'R5001',
		date: '2025-10-01',
		courseId: 'C100',
		courseName: 'AI Animation 9A',
		type: '收據',
		issuedTo: '陳小明'
	},
	{
		id: 'R5002',
		date: '2025-09-16',
		courseId: 'S200',
		courseName: 'Seminar-SEP-03',
		type: '證書',
		issuedTo: '林美麗'
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

const Receipts = () => {
			const onView = (r) => {
				alert(`查看收據/證書（模擬）\n編號：${r.id}\n課程：${r.courseId} - ${r.courseName}`);
			};

			const onDownload = (r) => {
				alert(`下載收據/證書（模擬）: ${r.id}`);
			};

	return (
		<div style={{ padding: 20 }}>
			<h1>收據與證書下載(Member)</h1>
		

			<table style={tableStyle}>
				<thead>
											<tr>
												<th style={thTdStyle}>開立日期</th>
												<th style={thTdStyle}>收據/證書號碼</th>
												<th style={thTdStyle}>課程號碼</th>
												<th style={thTdStyle}>課程名稱</th>
												<th style={thTdStyle}>類型</th>
												<th style={thTdStyle}>名稱</th>
												<th style={thTdStyle}>動作</th>
											</tr>
				</thead>
				<tbody>
					{mockReceipts.map((r) => (
									<tr key={r.id}>
										<td style={thTdStyle}>{r.date}</td>
										<td style={thTdStyle}>{r.id}</td>
										<td style={thTdStyle}>{r.courseId}</td>
										<td style={thTdStyle}>{r.courseName}</td>
										<td style={thTdStyle}>{r.type}</td>
										<td style={thTdStyle}>{r.issuedTo}</td>
										<td style={thTdStyle}>
											<button onClick={() => onView(r)} style={{ marginRight: 8 }}>查看</button>
											<button onClick={() => onDownload(r)}>下載</button>
										</td>
									</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Receipts;
