import React from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockNotifications = [
	{ id: 'XXX', date: 'XXX', title: 'XXX', level: 'XXX', message: 'XXX' },
	{ id: 'XXX', date: 'XXX', title: 'XXX', level: 'XXX', message: 'XXX' },
	{ id: 'XXX', date: 'XXX', title: 'XXX', level: 'XXX', message: 'XXX' }
];

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
