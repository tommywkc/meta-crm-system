import React from 'react';

const mockNotifications = [
	{ id: 'N1001', date: '2025-10-28 09:00', title: '系統維護', level: '重要', message: '系統將於 10/30 02:00-04:00 進行維護，屆時可能短暫無法使用。' },
	{ id: 'N1002', date: '2025-10-20 14:30', title: '新課開班：AI Animation', level: '一般', message: 'AI Animation 9A 班已開班，歡迎報名。' },
	{ id: 'N1003', date: '2025-09-15 11:20', title: '發票通知', level: '一般', message: '您的電子發票已上傳，可於收據頁下載。' }
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

const Notifications = () => {
	const onView = (n) => {
		alert(`通知：${n.title}\n\n${n.message}`);
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>通知中心(All role)</h1>
		

					<table style={tableStyle}>
						<thead>
							<tr>
								<th style={thTdStyle}>日期</th>
								<th style={thTdStyle}>標題</th>
								<th style={thTdStyle}>內容</th>
								<th style={thTdStyle}>動作</th>
							</tr>
						</thead>
						<tbody>
							{mockNotifications.map((n) => (
								<tr key={n.id}>
									<td style={thTdStyle}>{n.date}</td>
									<td style={thTdStyle}>{n.title}</td>
									<td style={thTdStyle}>{n.message.length > 80 ? `${n.message.slice(0, 80)}…` : n.message}</td>
									<td style={thTdStyle}>
										<button onClick={() => onView(n)} style={{ marginRight: 8 }}>查看</button>
										<button onClick={() => alert(`標記已讀 ${n.id}（模擬）`)}>標記已讀</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
		</div>
	);
};

export default Notifications;
