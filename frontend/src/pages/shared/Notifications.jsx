import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications } from '../../api/notificationsAPI';
import CommonTable from '../../components/CommonTable';
import { PageContainer, PageHeader } from '../../components/CommonPage';

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
			<PageContainer>
				<PageHeader title="通知中心 (All role)" />
				<p>載入中...</p>
			</PageContainer>
		);
	}

	if (error) {
		return (
			<PageContainer>
				<PageHeader title="通知中心 (All role)" />
				<p style={{ color: 'red' }}>{error}</p>
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<PageHeader title="通知中心 (All role)" />

			<CommonTable headers={['日期時間', '標題', '內容', '操作']} data={notifications} emptyMessage="暫無通知">
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
		</PageContainer>
	);
};

export default Notifications;
