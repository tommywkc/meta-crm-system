import React, { useState, useEffect } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { fetchEventsForDownload, fetchSessionsByEvent, fetchAttendanceList } from '../../api/downloadAPI';

const Download = () => {
	const [events, setEvents] = useState([]);
	const [sessions, setSessions] = useState([]);
	const [selectedEvent, setSelectedEvent] = useState('');
	const [selectedSession, setSelectedSession] = useState('');
	const [attendanceData, setAttendanceData] = useState([]);
	const [showPreview, setShowPreview] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Load events on component mount
	useEffect(() => {
		loadEvents();
	}, []);

	// Load sessions when event changes
	useEffect(() => {
		if (selectedEvent) {
			loadSessions(parseInt(selectedEvent));
			setSelectedSession('');
			setAttendanceData([]);
		}
	}, [selectedEvent]);

	// Load attendance data when session changes
	useEffect(() => {
		if (selectedSession) {
			loadAttendanceData(parseInt(selectedSession));
		}
	}, [selectedSession]);

	const loadEvents = async () => {
		try {
			setLoading(true);
			setError('');
			const data = await fetchEventsForDownload();
			console.log('Events loaded:', data);
			setEvents(data);
		} catch (err) {
			setError('無法載入活動列表：' + err.message);
			console.error('Error loading events:', err);
		} finally {
			setLoading(false);
		}
	};

	const loadSessions = async (eventId) => {
		try {
			setLoading(true);
			setError('');
			console.log('Loading sessions for eventId:', eventId, 'type:', typeof eventId);
			const data = await fetchSessionsByEvent(eventId);
			console.log('Sessions loaded:', data);
			console.log('Number of sessions:', data ? data.length : 0);
			setSessions(data);
		} catch (err) {
			setError('無法載入場次列表：' + err.message);
			console.error('Error loading sessions:', err);
		} finally {
			setLoading(false);
		}
	};

	const loadAttendanceData = async (sessionId) => {
		try {
			setLoading(true);
			setError('');
			console.log('Loading attendance data for sessionId:', sessionId, 'type:', typeof sessionId);
			const data = await fetchAttendanceList(sessionId);
			console.log('Attendance data loaded:', data);
			setAttendanceData(data.attendanceList || []);
		} catch (err) {
			setError('無法載入出席名單：' + err.message);
			console.error('Error loading attendance data:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!selectedEvent || !selectedSession) {
			alert('請選擇活動和場次');
			return;
		}

		const eventId = parseInt(selectedEvent);
		const sessionId = parseInt(selectedSession);
		
		console.log('handleDownload - selectedEvent:', selectedEvent, 'parsed:', eventId);
		console.log('handleDownload - selectedSession:', selectedSession, 'parsed:', sessionId);
		console.log('events array:', events);
		console.log('sessions array:', sessions);
		
		const event = events.find(e => {
			const match = e.event_id == eventId;
			console.log('comparing event', e.event_id, '(type:', typeof e.event_id, ') with', eventId, '(type:', typeof eventId, ') =', match);
			return match;
		});
		const session = sessions.find(s => {
			const match = s.session_id == sessionId;
			console.log('comparing session', s.session_id, '(type:', typeof s.session_id, ') with', sessionId, '(type:', typeof sessionId, ') =', match);
			return match;
		});

		if (!event || !session) {
			let errorMsg = '找不到選定的活動或場次';
			if (!event) errorMsg = `活動 ID ${eventId} 未找到`;
			if (!session) errorMsg = `場次 ID ${sessionId} 未找到`;
			alert(errorMsg);
			console.log('event found:', !!event, 'session found:', !!session);
			return;
		}

		// Create CSV content
		const sessionDate = session.datetime_start 
			? new Date(session.datetime_start).toLocaleDateString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
			: '未知日期';

		const csv = [
			['點名表', event.event_name, session.session_name, sessionDate].join(','),
			['編號', '姓名', '電話', '簽名', '標記'].join(','),
			...attendanceData.map(r => 
				[r.no, r.name, r.phone, r.signature || '', r.mark || ''].join(',')
			)
		].join('\n');

		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `點名表_${event.event_name}_${session.session_name}_${sessionDate}.csv`;
		link.click();
	};

	const handlePrint = () => {
		if (!selectedEvent || !selectedSession) {
			alert('請選擇活動和場次');
			return;
		}
		setShowPreview(true);
	};

	const getSessionDate = () => {
		const sessionId = parseInt(selectedSession);
		const session = sessions.find(s => s.session_id == sessionId);
		if (!session || !session.datetime_start) return '';
		return new Date(session.datetime_start).toLocaleDateString('zh-HK', { 
			year: 'numeric', 
			month: '2-digit', 
			day: '2-digit' 
		});
	};

	const getEventName = () => {
		const eventId = parseInt(selectedEvent);
		const event = events.find(e => e.event_id == eventId);
		return event ? event.event_name : '';
	};

	const getSessionName = () => {
		const sessionId = parseInt(selectedSession);
		const session = sessions.find(s => s.session_id == sessionId);
		return session ? session.session_name : '';
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>下載名單（課堂用）</h1>

			{error && (
				<div style={{ 
					backgroundColor: '#fee', 
					border: '1px solid #f99', 
					color: '#c33', 
					padding: 10, 
					marginBottom: 20,
					borderRadius: 4
				}}>
					{error}
				</div>
			)}

			<section style={{ marginBottom: 30 }}>
				<h2>點名表下載</h2>
				<div style={{ marginBottom: 10, fontSize: 12, color: '#999' }}>
					已加載活動: {events.length} | 已加載場次: {sessions.length}
				</div>
				<div style={{ marginBottom: 20 }}>
					<label style={{ marginRight: 15, display: 'inline-block', marginBottom: 10 }}>
						選擇活動：
						<select 
							value={selectedEvent}
							onChange={(e) => setSelectedEvent(e.target.value)}
							style={{ marginLeft: 8, padding: '5px 10px' }}
							disabled={loading}
						>
							<option value="">-- 請選擇 --</option>
							{events.map(e => {
								const dateStr = e.datetime_start 
									? new Date(e.datetime_start).toLocaleDateString('zh-HK')
									: '未知日期';
								return (
									<option key={e.event_id} value={String(e.event_id)}>
										{e.event_name} ({dateStr})
									</option>
								);
							})}
						</select>
					</label>
					<br />
					<label style={{ marginRight: 15, display: 'inline-block' }}>
						選擇場次：
						<select 
							value={selectedSession}
							onChange={(e) => setSelectedSession(e.target.value)}
							style={{ marginLeft: 8, padding: '5px 10px' }}
							disabled={loading || !selectedEvent}
						>
							<option value="">-- 請選擇 --</option>
							{sessions.map(s => {
								const dateStr = s.datetime_start
									? new Date(s.datetime_start).toLocaleDateString('zh-HK')
									: '未知日期';
								const timeStr = s.datetime_start
									? new Date(s.datetime_start).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })
									: '';
								return (
									<option key={s.session_id} value={String(s.session_id)}>
										{s.session_name} - {dateStr} {timeStr}
									</option>
								);
							})}
						</select>
					</label>
				</div>

				{selectedEvent && sessions.length === 0 && !loading && (
					<div style={{ 
						backgroundColor: '#fee', 
						border: '1px solid #f99', 
						color: '#c33', 
						padding: 10, 
						marginBottom: 20,
						borderRadius: 4
					}}>
						選定的活動沒有可用的場次。請選擇其他活動。
					</div>
				)}

				<div style={{ marginBottom: 20 }}>
					<button 
						onClick={handleDownload} 
						style={{ marginRight: 8, padding: '8px 16px', cursor: 'pointer' }}
						disabled={loading || !selectedSession}
					>
						{loading ? '正在載入...' : '下載 CSV'}
					</button>
					<button 
						onClick={handlePrint}
						style={{ padding: '8px 16px', cursor: 'pointer' }}
						disabled={loading || !selectedSession}
					>
						列印預覽
					</button>
				</div>

				{showPreview && (
					<div style={{ marginTop: 20, border: '1px solid #ccc', padding: 20, backgroundColor: '#f9f9f9' }}>
						<div style={{ textAlign: 'center', marginBottom: 20 }}>
							<h3>點名表 - {getEventName()} ({getSessionName()})</h3>
							<p>日期：{getSessionDate()}</p>
						</div>

						<table style={{ ...tableStyle, fontSize: 12 }}>
							<thead>
								<tr>
									<th style={{ ...thTdStyle, width: '5%' }}>編號</th>
									<th style={{ ...thTdStyle, width: '20%' }}>姓名</th>
									<th style={{ ...thTdStyle, width: '20%' }}>電話</th>
									<th style={{ ...thTdStyle, width: '40%' }}>簽名</th>
									<th style={{ ...thTdStyle, width: '15%' }}>標記</th>
								</tr>
							</thead>
							<tbody>
								{attendanceData.map((row) => (
									<tr key={row.no}>
										<td style={{ ...thTdStyle, textAlign: 'center' }}>{row.no}</td>
										<td style={thTdStyle}>{row.name}</td>
										<td style={thTdStyle}>{row.phone}</td>
										<td style={{ ...thTdStyle, height: 30 }}></td>
										<td style={{ ...thTdStyle, textAlign: 'center' }}>{row.mark}</td>
									</tr>
								))}
							</tbody>
						</table>

						{attendanceData.length === 0 && (
							<div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
								此場次暫無報名參加者
							</div>
						)}

						<div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
							<p>圖例：🔴 欠款 | 📄 證書未出 | 💬 特別座位</p>
						</div>

						<div style={{ marginTop: 20, textAlign: 'center' }}>
							<button 
								onClick={() => window.print()} 
								style={{ marginRight: 8, padding: '8px 16px', cursor: 'pointer' }}
							>
								列印
							</button>
							<button 
								onClick={() => setShowPreview(false)}
								style={{ padding: '8px 16px', cursor: 'pointer' }}
							>
								關閉預覽
							</button>
						</div>
					</div>
				)}
			</section>
		</div>
	);
};

export default Download;

