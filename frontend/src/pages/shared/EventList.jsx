import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EventsTable from '../../components/EventsTable';
import { UpperSelectContainerStyle, LowerSelectContainerStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';
import { handleListEvents, handleDeleteById } from '../../api/eventListAPI';

const EventList = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const userRole = user?.role?.toLowerCase();
	const isAdmin = userRole === 'admin';
	const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
	const isMember = userRole === 'member';
	
	// Pagination and search state
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);
	const [searchTerm, setSearchTerm] = useState('');

	const [events, setEvents] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			// 後端已針對角色處理可見性（member 只回 OPEN）
			const payload = await handleListEvents(100, 0);
			setEvents(payload.events || []);
		};
		fetchData();
	}, []);
	
	const fetchEvents = async () => {
		const payload = await handleListEvents(100, 0);
		setEvents(payload.events || []);
	};

	// 分頁計算
	const startIndex = (page - 1) * limit;
	const pagedEvents = events.slice(startIndex, startIndex + limit);
	const totalPages = Math.max(1, Math.ceil(events.length / limit));
	const canPrev = page > 1;
	const canNext = page < totalPages;
	
	const onCreate = () => {
		// navigate to create page
		navigate('/events/create');
	};
	const onEdit = (id) => {
		// navigate to edit page
		navigate(`/events/${id}/edit`);
	};

	const handleView = (event_id) => navigate(`/events/${event_id}`);

	const onEnroll = (id) => {
		navigate(`/events/${id}/apply`);
	};

	const onDelete = async (event_id) => {
		const event = events.find(e => e.event_id === event_id);
		const eventInfo = event 
			? `${event.type || ''} ${event.event_id} ${event.event_name || ''} ${event.datetime_start ? `(${event.datetime_start})` : ''}`
			: `活動 ID: ${event_id}`;
		
		if (window.confirm(`確認要刪除此活動？\n\n${eventInfo}`)) {
		  await handleDeleteById(event_id);  // remove from backend
		  alert('活動刪除成功！');
		  await fetchEvents();            // fetch latest data from backend
		}
	};

	const handleSearch = () => {
		console.log('Searching for:', searchTerm);
		// TODO: 實作搜尋邏輯
	};

		return (
			<div style={{ padding: 20 }}>
				<h1>
					{isAdmin ? '建立/編輯講座與課堂 (Admin)' : 
					 isSalesOrLeader ? `講座與課堂名單 (${user.role})` :
					 '講座與課堂名單 (Member)'}
				</h1>
		

				{isAdmin && (
					<button onClick={onCreate}>
						新增講座與課堂
					</button>
				)}

				<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
					<input 
						type="text" 
						placeholder="輸入[活動編號/名稱/類型/狀態]來搜尋." 
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
						style={searchInputStyle}
					/>
					<button onClick={handleSearch}>
						搜尋
					</button>
				</div>

				<div style={UpperSelectContainerStyle}>
					<label>
						頁數:&nbsp;
						<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
							{Array.from({ length: Math.max(1, Math.ceil(events.length / limit)) }, (_, i) => (
								<option key={i + 1} value={i + 1}>{i + 1}</option>
							))}
						</select>
					</label>

					<label>
						每頁活動數量:&nbsp;
						<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</label>
				</div>

				{/* 📋 Events table */}
				<EventsTable
					events={pagedEvents}
					role={user?.role}
					onView={handleView}
					onEdit={onEdit}
					onDelete={onDelete}
					onEnroll={onEnroll}
				/>

				<div style={LowerSelectContainerStyle}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<label>
							頁數:&nbsp;
							<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
								{Array.from({ length: totalPages }, (_, i) => (
									<option key={i + 1} value={i + 1}>{i + 1}</option>
								))}
							</select>
						</label>
						<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canPrev}>
							上一頁
						</button>
						<button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!canNext}>
							下一頁
						</button>
					</div>
				</div>
			</div>
	);
};

export default EventList;
