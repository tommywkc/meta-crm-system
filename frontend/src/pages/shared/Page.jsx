import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EventsTable from '../../components/EventsTable';
import { handleListEvents, handleDeleteById } from '../../api/eventListAPI';
import { handleListMyActiveEnrolledEvents } from '../../api/enrollmentAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const HomePage = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [events, setEvents] = useState([]);
	const [enrolledEventIds, setEnrolledEventIds] = useState([]);
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
		<div style={{ padding: 20 }}>
			<h1>Meta Academy</h1>
            <p>Welcome to Meta Academy CRM System.</p>

			<h2 style={{ marginTop: 30 }}>免費講座</h2>
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
		</div>
	);
};

export default HomePage;
