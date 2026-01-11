import React, { useEffect, useState } from 'react';
import { handleListFeedbacks } from '../../api/feedbackAPI';
import FeedbackTable from '../../components/FeedbackTable';

const FeedbackList = () => {
	const [feedbacks, setFeedbacks] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);
	const [lastPageReached, setLastPageReached] = useState(false);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const offset = (page - 1) * limit;
				const res = await handleListFeedbacks({ limit, offset });
				const list = Array.isArray(res) ? res : (res.feedbacks || []);
				setFeedbacks(list);
				setLastPageReached(list.length < limit);
			} catch (err) {
				console.error('Failed to load feedback list:', err);
				setError(err?.message || '載入意見回饋列表失敗');
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [page, limit]);

	const canPrev = page > 1;
	const canNext = !lastPageReached;

	return (
		<div style={{ padding: 20 }}>
			<h1>意見回饋列表</h1>

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && (
				<>
					<div style={{ marginBottom: 12 }}>
						<label>
							頁數: &nbsp; {page}
						</label>
						&nbsp;&nbsp;
						<label>
							每頁筆數:&nbsp;
							<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
								<option value={25}>25</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</label>
					</div>

					<FeedbackTable feedbacks={feedbacks} />

					<div style={{ marginTop: 12 }}>
						<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canPrev}>
							上一頁
						</button>
						&nbsp;
						<button onClick={() => setPage(p => p + 1)} disabled={!canNext}>
							下一頁
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default FeedbackList;

