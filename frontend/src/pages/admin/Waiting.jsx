import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import WaitingListTable from '../../components/WaitingListTable';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import { handleListWaitlist } from '../../api/waitlistAPI';

const Waiting = () => {
	const location = useLocation();
	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
	const sessionId = searchParams.get('session_id');
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

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

	return (
		<PageContainer>
			<PageHeader title="等待清單" />
			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}
			{!loading && !error && <WaitingListTable data={data} />}
		</PageContainer>
	);
};

export default Waiting;
