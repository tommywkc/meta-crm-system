import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications } from '../../api/notificationsAPI';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const Notifications = () => {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchNotifications = async () => {
			try {
				setLoading(true);
				const data = await getNotifications(50, 0);
				setNotifications(data.notifications || []);
				setError(null);
			} catch (err) {
				console.error('Error fetching notifications:', err);
				setError('無法載入通知');
				setNotifications([]);
			} finally {
				setLoading(false);
			}
		};

		if (user) {
			fetchNotifications();
		}
	}, [user]);

	const onView = (n) => {
		const time = n.create_time ? new Date(n.create_time).toLocaleString('zh-HK') : '—';
		alert(`通知：${n.template}\n時間：${time}\n\n${n.description}`);
	};

	if (loading) {
		return (
			<div style={{ padding: 20 }}>
				<h1>通知中心 (All role)</h1>
				<p>載入中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: 20 }}>
				<h1>通知中心 (All role)</h1>
				<p style={{ color: 'red' }}>{error}</p>
			</div>
		);
	}

	return (
		<div style={{ padding: 20 }}>
			<h1>通知中心 (All role)</h1>

			{notifications.length === 0 ? (
				<p>暫無通知</p>
			) : (
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>日期時間</th>
							<th style={thTdStyle}>標題</th>
							<th style={thTdStyle}>內容</th>
							<th style={thTdStyle}>動作</th>
						</tr>
					</thead>
					<tbody>
						{notifications.map((n) => (
							<tr key={n.notification_id}>
								<td style={thTdStyle}>
									{n.create_time ? new Date(n.create_time).toLocaleString('zh-HK') : '—'}
								</td>
								<td style={thTdStyle}>{n.template}</td>
								<td style={thTdStyle}>
									{n.description && n.description.length > 80
										? `${n.description.slice(0, 80)}…`
										: n.description}
								</td>
								<td style={thTdStyle}>
									<button onClick={() => onView(n)} style={{ marginRight: 8 }}>
										查看
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default Notifications;
