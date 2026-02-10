import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import WaitingListTable from '../../components/WaitingListTable';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import { handleListWaitlist, handleUpdateWaitlistRank } from '../../api/waitlistAPI';
import { handleGetSessionById } from '../../api/sessionAPI';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const Waiting = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useAuth();
	const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
	const sessionId = searchParams.get('session_id');
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [sessionInfo, setSessionInfo] = useState(null);
	const [eventInfo, setEventInfo] = useState(null);
	const topicRow = data && data.length > 0 ? data[0] : null;

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const payload = await handleListWaitlist(sessionId);
				setData(Array.isArray(payload?.waitlist) ? payload.waitlist : []);
			} catch (err) {
				setData([]);
				setError(err?.message || '取得候補清單失敗');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [sessionId]);

	useEffect(() => {
		const fetchSessionAndEvent = async () => {
			if (!sessionId) return;
			try {
				const res = await handleGetSessionById(sessionId);
				const session = res?.session || null;
				setSessionInfo(session);
				if (session?.event_id) {
					const eventRes = await handleGetEventById(session.event_id);
					setEventInfo(eventRes?.event || null);
				} else {
					setEventInfo(null);
				}
			} catch (err) {
				setSessionInfo(null);
				setEventInfo(null);
			}
		};
		fetchSessionAndEvent();
	}, [sessionId]);

	return (
		<PageContainer>
			<PageHeader title="等待清單" showBack={true} onBack={() => navigate(-1)} />
			{(topicRow || sessionInfo || eventInfo) && (
				<div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
					<div>
						<div>
							活動 ID: {topicRow?.event_id || eventInfo?.event_id || sessionInfo?.event_id || '-'} ｜ 課堂/講座名稱: {topicRow?.event_name || eventInfo?.event_name || '-'}
						</div>
						<div>
							場次 ID: {topicRow?.session_id || sessionInfo?.session_id || sessionId || '-'} ｜ 場次名稱: {topicRow?.session_name || sessionInfo?.session_name || '-'} ｜ 時間:{' '}
							{(topicRow?.datetime_start || sessionInfo?.datetime_start) ? formatDateTimeForDisplay(topicRow?.datetime_start || sessionInfo?.datetime_start) : '-'}
						</div>
					</div>
					{(topicRow?.event_id || sessionInfo?.event_id) && (topicRow?.session_id || sessionInfo?.session_id || sessionId) ? (
						<button onClick={() => navigate(`/events/${topicRow?.event_id || sessionInfo?.event_id}/enrollsession?session_id=${topicRow?.session_id || sessionInfo?.session_id || sessionId}`)}>
							報名
						</button>
					) : null}
				</div>
			)}
			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}
			{!loading && !error && (
				<WaitingListTable
					data={data}
					isAdmin={isAdmin}
					onUpdateRank={async (row, nextRank) => {
						try {
							await handleUpdateWaitlistRank({
								session_id: row.session_id || sessionId,
								user_id: row.user_id,
								new_rank: nextRank,
							});
							const payload = await handleListWaitlist(sessionId);
							setData(Array.isArray(payload?.waitlist) ? payload.waitlist : []);
						} catch (err) {
							alert(err?.message || '更新排名失敗');
						}
					}}
				/>
			)}
		</PageContainer>
	);
};

export default Waiting;
