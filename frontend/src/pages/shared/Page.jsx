import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EventsTable from '../../components/EventsTable';
import { handleListEvents, handleDeleteById } from '../../api/eventListAPI';
import { handleListMyActiveEnrolledEvents } from '../../api/enrollmentAPI';
import { handleListMyUpcomingSessions } from '../../api/sessionAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import StudentWorkWall from '../../components/StudentWorkWall';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import CommonTable from '../../components/CommonTable';

const HomePage = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [events, setEvents] = useState([]);
	const [enrolledEventIds, setEnrolledEventIds] = useState([]);
	const [upcomingSessions, setUpcomingSessions] = useState([]);
	const [upcomingLoading, setUpcomingLoading] = useState(false);
    const isAdmin = user?.role?.toLowerCase() === 'admin';

	const loadEvents = async () => {
		try {
			const payload = await handleListEvents({ status: 'OPEN' });
			const allEvents = payload.events || [];
			// Filter for SEMINAR types only and status OPEN (though API helps with status)
			const seminars = allEvents.filter(e => e.type === 'SEMINAR');
			setEvents(seminars);
		} catch (err) {
			console.error('Failed to fetch home page events', err);
		}
	};

	useEffect(() => {
		loadEvents();
	}, []);

	useEffect(() => {
		if (!user || user.role.toLowerCase() !== 'member') {
			setEnrolledEventIds([]);
			return;
		}
		const fetchEnrolled = async () => {
			try {
				const payload = await handleListMyActiveEnrolledEvents();
				setEnrolledEventIds(Array.isArray(payload.eventIds) ? payload.eventIds : []);
			} catch (e) {
				console.error('Failed to load active enrolled events for current user', e);
				setEnrolledEventIds([]);
			}
		};
		fetchEnrolled();
	}, [user]);

	useEffect(() => {
		if (user?.role?.toLowerCase() === 'member') {
			const fetchUpcoming = async () => {
				setUpcomingLoading(true);
				try {
					const res = await handleListMyUpcomingSessions(5);
					setUpcomingSessions(res.sessions || []);
				} catch (e) {
					console.error('Failed to load upcoming sessions', e);
				} finally {
					setUpcomingLoading(false);
				}
			};
			fetchUpcoming();
		}
	}, [user]);

	const handleView = (id) => navigate(`/events/${id}`);
	// Reuse the enroll flow from EventList
	const handleEnroll = (id) => navigate(`/events/${id}/apply`);

    const handleEdit = (id) => navigate(`/events/${id}/edit`);

    const handleDelete = async (event_id) => {
        const event = events.find(e => e.event_id === event_id);
		const eventInfo = event 
			? `${event.type || ''} ${event.event_id} ${event.event_name || ''} ${event.datetime_start ? `(${formatDateTimeForDisplay(event.datetime_start)})` : ''}`
			: `活動 ID: ${event_id}`;
		
		if (window.confirm(`確認要刪除此活動？\n\n${eventInfo}`)) {
		    try {
		      await handleDeleteById(event_id);
		      alert('活動刪除成功！');
              await loadEvents();
            } catch (error) {
                console.error('Delete failed', error);
                alert('刪除失敗，請稍後再試');
            }
		}
    };

	return (
		<PageContainer>

			<PageHeader title="免費講座" />
			{events.length > 0 ? (
				<EventsTable 
					events={events}
					role={user?.role}
					enrolledEventIds={enrolledEventIds}
					onView={handleView}
					onEnroll={handleEnroll}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
				/>
			) : (
				<div style={{ padding: 10, color: '#666' }}>目前沒有開放中的講座。</div>
			)}

			{user?.role?.toLowerCase() === 'member' && (
				<div style={{ marginTop: 30, marginBottom: 30 }}>
					<h3>即將到來的5堂課</h3>
					{upcomingLoading ? (
						<p>載入中...</p>
					) : (
						<>
							<CommonTable
								headers={['日期時間(日/月/年)', '課堂名稱', '場次']}
								data={upcomingSessions}
								emptyMessage="暫時沒有即將到來的課堂"
							>
								{upcomingSessions.map((s) => (
									<tr key={s.registration_id}>
										<td>
											{s.datetime_start ? formatDateTimeForDisplay(s.datetime_start) : 'N/A'}
										</td>
										<td>{s.event_name || '-'}</td>
										<td>{s.session_name || '-'}</td>
									</tr>
								))}
							</CommonTable>
							{upcomingSessions.length > 0 && (
								<button onClick={() => navigate('/sessions/enrolled')}>查看所有即將到來的場次</button>
							)}
						</>
					)}
				</div>
			)}
			
			<StudentWorkWall />
		</PageContainer>
	);
};

export default HomePage;
