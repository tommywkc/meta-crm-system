import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications } from '../../api/notificationsAPI';
import CommonTable from '../../components/CommonTable';

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
		const datetime = n.create_time ? new Date(n.create_time).toLocaleString('zh-HK') : '—';
		alert(`日期時間：${datetime}\n通知：${n.template}\n\n${n.description}`);
	};

	if (loading) {
		return (
			<div style={{ padding: 20 }}>
				<h2>通知中心 (All role)</h2>
				<p>載入中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: 20 }}>
				<h2>通知中心 (All role)</h2>
				<p style={{ color: 'red' }}>{error}</p>
			</div>
		);
	}

	return (
		<div style={{ padding: 20 }}>
			<h2>通知中心 (All role)</h2>

			{notifications.length === 0 ? (
				<p>暫無通知</p>
			) : (
				<CommonTable headers={['日期時間', '標題', '內容', '操作']}>
					{notifications.map((n) => (
						<tr key={n.notification_id}>
							<td>
								{n.create_time ? new Date(n.create_time).toLocaleString('zh-HK') : '—'}
							</td>
							<td>{n.template}</td>
							<td>
								{n.description && n.description.length > 80
									? `${n.description.slice(0, 80)}…`
									: n.description}
							</td>
							<td>
								<button onClick={() => onView(n)} style={{ marginRight: 8 }}>
									查看
								</button>
							</td>
						</tr>
					))}
				</CommonTable>
			)}
		</div>
	);
};

export default Notifications;
