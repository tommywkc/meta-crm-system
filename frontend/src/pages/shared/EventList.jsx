import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EventsTable from '../../components/EventsTable';
import { UpperSelectContainerStyle, LowerSelectContainerStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';
import { handleListEvents, handleDeleteById } from '../../api/eventListAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

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
	const [isSearching, setIsSearching] = useState(false);

	const [events, setEvents] = useState([]);
		const [enrolledEventIds, setEnrolledEventIds] = useState([]);
	const [filteredEvents, setFilteredEvents] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			const payload = await handleListEvents({ limit: 100, offset: 0, q: '' });
			setEvents(payload.events || []);
			setFilteredEvents(payload.events || []);
		};
		fetchData();
	}, []);

		// 讀取 sessionStorage 中已報名的活動 ID
		useEffect(() => {
			try {
				const enrolled = JSON.parse(sessionStorage.getItem('enrolledEventIds') || '[]');
				setEnrolledEventIds(Array.isArray(enrolled) ? enrolled : []);
			} catch (e) {
				setEnrolledEventIds([]);
			}
		}, []);
	
	const fetchEvents = async () => {
		const payload = await handleListEvents({ limit: 100, offset: 0, q: '' });
		setEvents(payload.events || []);
		setFilteredEvents(payload.events || []);
	};

	// 搜尋邏輯 - 搜尋活動編號、名稱、類型、狀態
	const performSearch = async (term) => {
		if (!term || !term.trim()) {
			// clear search: reload
			await fetchEvents();
			setIsSearching(false);
			setPage(1);
			return;
		}

		try {
			const payload = await handleListEvents({ limit: 100, offset: 0, q: term });
			setEvents(payload.events || []);
			setFilteredEvents(payload.events || []);
			setIsSearching(true);
			setPage(1);
		} catch (err) {
			console.error('Event search failed:', err);
			alert('搜尋活動失敗，請稍後再試');
		}
	};

	const handleSearch = () => performSearch(searchTerm);

	const handleSearchInputChange = (e) => {
		setSearchTerm(e.target.value);
	};

	const handleSearchKeyDown = (e) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	// 分頁計算 - 基於過濾後的活動,並依活動 ID 升冪排序
	const displayedEvents = isSearching ? filteredEvents : events;
	
	// 對顯示的活動進行排序
	const sortedEvents = (displayedEvents || []).slice().sort((a, b) => {
		const aId = Number(a?.event_id) || 0;
		const bId = Number(b?.event_id) || 0;
		return aId - bId;
	});
	
	const startIndex = (page - 1) * limit;
	const pagedEvents = sortedEvents.slice(startIndex, startIndex + limit);
	const totalPages = Math.max(1, Math.ceil(displayedEvents.length / limit));
	const canPrev = page > 1;
	const canNext = page < totalPages;
	const totalResults = displayedEvents.length;
	
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
		const event = events.find(e => e.event_id === id);
		if (event && event.status !== 'OPEN') {
			alert('留意此活動目前未公開報名');
			navigate(`/events/${id}/apply`);
		}
		navigate(`/events/${id}/apply`);
	};

	const onDelete = async (event_id) => {
		const event = events.find(e => e.event_id === event_id);
		const eventInfo = event 
			? `${event.type || ''} ${event.event_id} ${event.event_name || ''} ${event.datetime_start ? `(${formatDateTimeForDisplay(event.datetime_start)})` : ''}`
			: `活動 ID: ${event_id}`;
		
		if (window.confirm(`確認要刪除此活動？\n\n${eventInfo}`)) {
		  await handleDeleteById(event_id);  // remove from backend
		  alert('活動刪除成功！');
		  await fetchEvents();            // fetch latest data from backend
		}
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
					placeholder="輸入[活動編號/名稱]來搜尋." 
					value={searchTerm}
					onChange={handleSearchInputChange}
					onKeyDown={handleSearchKeyDown}
					style={searchInputStyle}
				/>
				<button onClick={handleSearch}>
					搜尋
				</button>
				{isSearching && (
					<span style={{ color: '#666', fontSize: '14px' }}>
						找到 {totalResults} 筆結果
					</span>
				)}
			</div>

			<div style={UpperSelectContainerStyle}>
				<label>
					頁數:&nbsp;
					<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
						{Array.from({ length: totalPages }, (_, i) => (
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

				<span style={{ marginLeft: '20px', color: '#666', fontSize: '14px' }}>
					顯示 {Math.min(startIndex + 1, totalResults)}-{Math.min(startIndex + limit, totalResults)} / 共 {totalResults} 筆
				</span>
			</div>

				{/* 📋 Events table */}
				<EventsTable
						events={pagedEvents}
						enrolledEventIds={enrolledEventIds}
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
