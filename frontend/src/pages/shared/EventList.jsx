import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EventsTable from '../../components/EventsTable';
import { UpperSelectContainerStyle, LowerSelectContainerStyle, commonSelectStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';
import { handleListEvents, handleDeleteById } from '../../api/eventListAPI';
import { handleListMyActiveEnrolledEvents, handleConfirmEnrollmentByUser } from '../../api/enrollmentAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const EventList = () => {
	const navigate = useNavigate();
	const location = useLocation();
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
        const [sortBy, setSortBy] = useState('event_id');
        const [sortOrder, setSortOrder] = useState('asc');

        useEffect(() => {
                const fetchData = async () => {
                        const params = new URLSearchParams(location.search || '');
                        const userIdParam = (params.get('user_id') || '').trim();
                        if (userIdParam) {
                                try {
                                        const payload = await handleConfirmEnrollmentByUser(userIdParam, 200, 0);
                                        const enrolledEvents = payload.enrollments || [];
                                        setEvents(enrolledEvents);
                                        setFilteredEvents(enrolledEvents);      
                                        setIsSearching(false);
                                        setSearchTerm('');
                                        setPage(1);
                                        return;
                                } catch (err) {
                                        console.error('Failed to load enrolled events for user', err);
                                }
                        }
                        const payload = await handleListEvents({ limit: 100, offset: 0, q: '', sortBy, sortOrder });
                        setEvents(payload.events || []);
                        setFilteredEvents(payload.events || []);
                };
                fetchData();
        }, [location.search, sortBy, sortOrder]);

        useEffect(() => {
                if (!isMember) {
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
		}, [isMember]);
	
	const fetchEvents = async () => {
                const payload = await handleListEvents({ limit: 100, offset: 0, q: '', sortBy, sortOrder });
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
                        const payload = await handleListEvents({ limit: 100, offset: 0, q: term, sortBy, sortOrder });
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

// 分頁計算 - 基於過濾後的活動
        const displayedEvents = isSearching ? filteredEvents : events;

        const startIndex = (page - 1) * limit;
        const pagedEvents = displayedEvents.slice(startIndex, startIndex + limit); 
	const totalPages = Math.max(1, Math.ceil(displayedEvents.length / limit));
	const canPrev = page > 1;
	const canNext = page < totalPages;
	const totalResults = displayedEvents.length;
	

	const onEdit = (id) => {
		// navigate to edit page
		navigate(`/events/${id}/edit`);
	};

	const handleView = (event_id) => { 
		try {
			navigate(`/events/${event_id}`);
		} catch (error) {
			console.error('Failed to navigate to event view:', error);
			alert('無法前往活動詳情頁面，請稍後重試');
		}
	};

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
		<PageContainer>
			<PageHeader
				title={
					isAdmin ? '建立/編輯講座與課堂 (Admin)' : 
					isSalesOrLeader ? `講座與課堂名單 (${user.role})` :
					'講座與課堂名單 (Member)'
				}
			/>
		

				{isAdmin && (
					<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
						<button onClick={() => navigate('/events/create')}>
							新增講座與課堂
						</button>
						<button onClick={() => navigate('/events/import')}>
							匯入活動Excel
						</button>
	        			</div>
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
				<button onClick={() => { setSearchTerm(''); fetchEvents(); setPage(1); setIsSearching(false); }}>
					清除
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
					<select 
						value={page} 
						onChange={(e) => setPage(Number(e.target.value))}
						style={commonSelectStyle}
					>
						{Array.from({ length: totalPages }, (_, i) => (
							<option key={i + 1} value={i + 1}>{i + 1}</option>
						))}
					</select>
				</label>

				<label>
					每頁活動數量:&nbsp;
					<select 
						value={limit} 
						onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
						style={commonSelectStyle}
					>
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
                                        sortBy={sortBy}
                                        sortOrder={sortOrder}
                                        onSort={(newSortBy) => {
                                                if (sortBy === newSortBy) {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                        setSortBy(newSortBy);
                                                        setSortOrder('asc');
                                                }
                                        }}
                                />

                                <div style={LowerSelectContainerStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <label>
                                                        頁數:&nbsp;
                                                        <select
                                                                value={page}
                                                                onChange={(e) => setPage(Number(e.target.value))}
                                                                style={commonSelectStyle}
							>
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
			</PageContainer>
	);
};

export default EventList;
