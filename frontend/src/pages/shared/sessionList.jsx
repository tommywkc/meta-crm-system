import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListEnrolledUpcomingSessions } from '../../api/sessionAPI';
import { UpperSelectContainerStyle, LowerSelectContainerStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

// 場次報名列表頁：顯示所有「尚未開始」的已報名場次.
// - 會員：只能看到自己的場次
// - Admin / Sales / Leader：可以看到全部人的場次
const SessionListPage = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const userRole = user?.role?.toLowerCase();
	const isAdmin = userRole === 'admin';
	const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
	const isMember = userRole === 'member';

	const [sessions, setSessions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);
	const [searchTerm, setSearchTerm] = useState('');
	const [appliedQ, setAppliedQ] = useState('');

	useEffect(() => {
		const load = async () => {
			if (!user?.id) {
				setLoading(false);
				return;
			}
			try {
				// 僅允許 admin / sales / leader / member 進入
				if (!isAdmin && !isSalesOrLeader && !isMember) {
					alert('您沒有權限查看此頁面');
					navigate('/');
					return;
				}

				const res = await handleListEnrolledUpcomingSessions(100, 0, appliedQ);
				const list = Array.isArray(res.sessions) ? res.sessions : [];
				setSessions(list);
				setError(null);
			} catch (e) {
				console.error('Failed to load enrolled upcoming sessions list:', e);
				setError(e?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [user?.id, isAdmin, isSalesOrLeader, isMember, navigate, appliedQ]);

	const handleSearch = () => {
		// Apply search to backend
		setAppliedQ(searchTerm.trim());
		setPage(1);
	};

	const handleClear = () => {
		// Reset all filters and reload
		setSearchTerm('');
		setAppliedQ('');
		setPage(1);
	};

	const filteredSessions = sessions;

	// 依開始時間排序
	const sortedSessions = filteredSessions.slice().sort((a, b) => {
		const aTime = a.datetime_start ? new Date(a.datetime_start).getTime() : 0;
		const bTime = b.datetime_start ? new Date(b.datetime_start).getTime() : 0;
		return aTime - bTime;
	});

	// 分頁
	const startIndex = (page - 1) * limit;
	const pagedSessions = sortedSessions.slice(startIndex, startIndex + limit);
	const totalPages = Math.max(1, Math.ceil(sortedSessions.length / limit));
	const canPrev = page > 1;
	const canNext = page < totalPages;
	const totalResults = sortedSessions.length;

	const handleViewEvent = (session) => {
		if (!session?.event_id) return;
		navigate(`/events/${session.event_id}`);
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>已報名場次列表（尚未開始）</h1>

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && (
				<>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
					<input
						type="text"
						placeholder="輸入 [課堂名稱/場次/地點/學員ID或姓名] 來搜尋..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleSearch();
						}}
						style={searchInputStyle}
					/>
					<button onClick={handleSearch}>搜尋</button>
					<button onClick={handleClear}>清除</button>
					{appliedQ && (
						<span style={{ color: '#666', fontSize: '14px' }}>
							共 {totalResults} 筆符合條件的場次
						</span>
					)}
				</div>					<div style={UpperSelectContainerStyle}>
						<label>
							頁數:&nbsp;
							<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
								{Array.from({ length: totalPages }, (_, i) => (
									<option key={i + 1} value={i + 1}>
										{i + 1}
									</option>
								))}
							</select>
						</label>

						<label>
							每頁場次數量:&nbsp;
							<select
								value={limit}
								onChange={(e) => {
									setLimit(Number(e.target.value));
									setPage(1);
								}}
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

					<table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
						<thead>
							<tr>
								<th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>日期時間(日/月/年)</th>
								<th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>課堂編號與名稱</th>
								<th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>場次</th>
								<th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>地點</th>
								{(isAdmin || isSalesOrLeader) && (
									<th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>學員</th>
								)}
								<th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>操作</th>
							</tr>
						</thead>
						<tbody>
							{pagedSessions.length === 0 ? (
								<tr>
									<td colSpan={isAdmin || isSalesOrLeader ? 5 : 4} style={{ padding: '8px', textAlign: 'center' }}>
										暫時沒有即將開始的已報名場次
									</td>
								</tr>
							) : (
								pagedSessions.map((s) => (
									<tr key={s.registration_id}>
										<td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>
											{s.datetime_start ? formatDateTimeForDisplay(s.datetime_start) : 'N/A'}
										</td>
										<td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>{s.event_id} - {s.event_name || '-'}</td>
										<td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>{s.session_name || '-'}</td>
										<td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>{s.location || '-'}</td>
										{(isAdmin || isSalesOrLeader) && (
											<td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>
												{s.user_name || s.user_id || '-'}
											</td>
										)}
										<td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>
											{s.event_id ? (
												<button onClick={() => handleViewEvent(s)}>查看活動</button>
											) : (
												'-'
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>

					<div style={LowerSelectContainerStyle}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<label>
								頁數:&nbsp;
								<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
									{Array.from({ length: totalPages }, (_, i) => (
										<option key={i + 1} value={i + 1}>
											{i + 1}
										</option>
									))}
								</select>
							</label>
							<button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
								上一頁
							</button>
							<button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={!canNext}>
								下一頁
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default SessionListPage;