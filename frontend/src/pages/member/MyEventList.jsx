import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EventsTable from '../../components/EventsTable';
import { UpperSelectContainerStyle, LowerSelectContainerStyle, commonSelectStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';
import { handleConfirmEnrollmentByUser } from '../../api/enrollmentAPI';
import { handleListEvents } from '../../api/eventListAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const MyEventList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userRole = user?.role?.toLowerCase();
    const isMember = userRole === 'member';

    // Pagination and search state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);

    useEffect(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    
                    // Get confirmed enrollments (returns enrollments with event details already merged)
                    const enrollmentPayload = await handleConfirmEnrollmentByUser(user?.id, 100, 0);
                    const enrollments = enrollmentPayload?.enrollments || [];
                    
                    console.log('Confirmed enrollments:', enrollments);
                    
                    setEvents(enrollments);
                    setFilteredEvents(enrollments);
                } catch (err) {
                    console.error('Failed to fetch events:', err);
                    setError(err.message || 'Failed to load events');
                } finally {
                    setLoading(false);
                }
            };
            if (user?.id) fetchData();
        }, [user?.id]);

    // 搜尋邏輯 - 搜尋活動編號、名稱、類型、狀態
    const performSearch = (term) => {
		if (!term.trim()) {
			setFilteredEvents(events);
			setIsSearching(false);
			setPage(1);
			return;
		}

		const searchLower = term.toLowerCase();
		const results = events.filter(event => 
			(event.event_id && event.event_id.toLowerCase().includes(searchLower)) ||
			(event.event_name && event.event_name.toLowerCase().includes(searchLower)) ||
			(event.type && event.type.toLowerCase().includes(searchLower)) ||
			(event.status && event.status.toLowerCase().includes(searchLower))
		);

		setFilteredEvents(results);
		setIsSearching(true);
		setPage(1);
	};

	const handleSearch = () => {
		performSearch(searchTerm);
	};

	const handleSearchInputChange = (e) => {
		setSearchTerm(e.target.value);
	};

	const handleSearchKeyDown = (e) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

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

    const handleView = (event_id) => navigate(`/events/${event_id}`);

    const handleHomework = (event_id) => navigate(`/events/${event_id}/homework`);

    return (
        <div>
            <h2>我的活動</h2>
            <div style={UpperSelectContainerStyle}>
                <input
                    type="text"
                    placeholder="搜尋活動編號、名稱、類型、狀態"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearchKeyDown}
                    style={searchInputStyle}
                />
                <button onClick={handleSearch}>搜尋</button>
            </div>
            <EventsTable
                events={pagedEvents}
                onView={handleView}
                onHomework={handleHomework}
                viewButtonLabel="詳情/報名場次"
            />
            <div style={LowerSelectContainerStyle}>
                <div>
                    第 {startIndex + 1} - {Math.min(startIndex + limit, totalResults)} 筆，共 {totalResults} 筆結果
                </div>
                <div>
                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={!canPrev}>
                        上一頁
                    </button>
                    <select 
                        value={page} 
                        onChange={(e) => setPage(Number(e.target.value))}
                        style={commonSelectStyle}
                    >
                        {Array.from({ length: totalPages }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={!canNext}>
                        下一頁
                    </button>
                </div>
            </div>
        </div>
    );  
}

export default MyEventList;