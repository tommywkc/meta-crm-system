import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../../components/Calendar';
import { handleListMyUpcomingSessions, handleListMySessionsByYear } from '../../api/sessionAPI';
import { formatDateKey, formatDateTimeForDisplay, formatForDisplay } from '../../utils/dateFormatter';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import CommonTable from '../../components/CommonTable';

const MemberCalendarPage = () => {
	const navigate = useNavigate();
	const today = new Date();
	const initialYear = today.getFullYear();

	const [calendarYear, setCalendarYear] = useState(initialYear);
	const [eventsByYear, setEventsByYear] = useState({});
	const [calendarLoading, setCalendarLoading] = useState(false);
	const [calendarError, setCalendarError] = useState(null);

	const [upcomingSessions, setUpcomingSessions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// load sessions for a specific year for calendar
	const loadYearData = async (year) => {
		try {
			setCalendarLoading(true);
			setCalendarError(null);
			const res = await handleListMySessionsByYear(year);
			const sessions = res.sessions || [];
			const map = {};
			sessions.forEach((s) => {
				if (!s.datetime_start) return;
				const date = new Date(s.datetime_start);
				const key = formatDateKey(date);
				const labelParts = [];
				if (s.event_name) labelParts.push(s.event_name);
				if (s.session_name) labelParts.push(s.session_name);
				const label = labelParts.join(' - ') || '課堂';
				if (!map[key]) map[key] = [];
				map[key].push({
					label,
					start: s.datetime_start,
					end: s.datetime_end,
				});
			});
			setEventsByYear((prev) => ({ ...prev, [year]: map }));
		} catch (err) {
			console.error('Failed to load calendar sessions for year', year, err);
			setCalendarError('無法載入此年度的課程');
		} finally {
			setCalendarLoading(false);
		}
	};

	useEffect(() => {
		let mounted = true;
		async function fetchUpcoming() {
			try {
				const res = await handleListMyUpcomingSessions(5);
				if (!mounted) return;
				setUpcomingSessions(res.sessions || []);
				setError(null);
			} catch (err) {
				if (!mounted) return;
				console.error('Failed to load upcoming sessions:', err);
				setError('無法載入即將到來的課堂');
			} finally {
				if (mounted) setLoading(false);
			}
		}
		fetchUpcoming();
		return () => { mounted = false; };
	}, []);

	// initial load for current year
	useEffect(() => {
		if (!eventsByYear[initialYear]) {
			loadYearData(initialYear);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleCalendarYearChange = (year) => {
		setCalendarYear(year);
		if (!eventsByYear[year]) {
			loadYearData(year);
		}
	};

	return (
		<PageContainer>
			<PageHeader title="我的日曆" />
			{/* Original Title H2 Removed */}
			<section>
				<h2>課程日曆</h2>
				<div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
					<div style={{ flex: 1 }}>
						{calendarError && <p style={{ color: 'red' }}>{calendarError}</p>}
						<Calendar
							events={eventsByYear[calendarYear] || {}}
							onYearChange={handleCalendarYearChange}
						/>
						{calendarLoading && <p>日曆載入中...</p>}
					</div>
					<div style={{ flex: 1 }}>
						<h3>即將到來的5堂課</h3>
						{loading ? (
							<p>載入中...</p>
						) : error ? (
							<p style={{ color: 'red' }}>{error}</p>
						) : (
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
						)}
						<div style={{ marginTop: 12 }}>
							<button onClick={() => navigate('/sessions/enrolled')}>
								查看所有即將到來的場次
							</button>
						</div>
					</div>
				</div>
			</section>
		</PageContainer>
	);
};

export default MemberCalendarPage;
