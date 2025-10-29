import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockRequests = [
	{
		id: 'RQ1001',
		submittedAt: '2025-10-20 10:12',
		type: '覆課',
		courseId: 'C100',
		courseName: 'AI Animation 9A',
		session: '第3堂',
		requestedDate: '2025-10-25 19:00',
		status: '待處理',
		note: '因事請假，申請覆課'
	},
	{
		id: 'RQ1002',
		submittedAt: '2025-09-28 14:05',
		type: '請假',
		courseId: 'C101',
		courseName: 'Drawing Basics',
		session: '第1堂',
		requestedDate: '2025-10-01',
		status: '已核准',
		note: '生病請假'
	}
];

const Requests = () => {
		const navigate = useNavigate();
		const location = useLocation();
		const [requests, setRequests] = useState(mockRequests);

		useEffect(() => {
			// if navigated back from the create form with a newRequest, prepend it
			if (location && location.state && location.state.newRequest) {
				setRequests((prev) => [location.state.newRequest, ...prev]);
				// replace history state to avoid re-adding on further navigations
				navigate(location.pathname, { replace: true });
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

	const onView = (r) => {
		alert(`查看申請（模擬）\n編號：${r.id}\n類型：${r.type}\n課程：${r.courseId} ${r.courseName}\n備註：${r.note}`);
	};

	const onCancel = (r) => {
		if (r.status !== '待處理') {
			alert('只有「待處理」的申請可以取消');
			return;
		}
		const ok = window.confirm(`確定要取消申請 ${r.id} 嗎？`);
		if (ok) {
			// simulate cancel by updating local state
			setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: '已取消' } : x)));
			alert(`模擬：已取消 ${r.id}`);
		}
	};

		const handleCreateClick = () => {
			navigate('/requests/create');
		};

	return (
		<div style={{ padding: 20 }}>
			<h1>覆課 / 補堂 / 請假申請(Member)</h1>
		

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div />
						<div>
							<button onClick={handleCreateClick}>申請</button>
						</div>
					</div>

			<table style={tableStyle}>
				<thead>
					<tr>
						<th style={thTdStyle}>申請時間</th>
						<th style={thTdStyle}>類型</th>
						<th style={thTdStyle}>課程號碼</th>
						<th style={thTdStyle}>課程名稱</th>
						<th style={thTdStyle}>申請場次/日期</th>
						<th style={thTdStyle}>狀態</th>
						<th style={thTdStyle}>備註</th>
						<th style={thTdStyle}>動作</th>
					</tr>
				</thead>
				<tbody>
					{requests.map((r) => (
						<tr key={r.id}>
							<td style={thTdStyle}>{r.submittedAt}</td>
							<td style={thTdStyle}>{r.type}</td>
							<td style={thTdStyle}>{r.courseId}</td>
							<td style={thTdStyle}>{r.courseName}</td>
							<td style={thTdStyle}>{r.session} {r.requestedDate}</td>
							<td style={thTdStyle}>{r.status}</td>
							<td style={thTdStyle}>{r.note}</td>
							<td style={thTdStyle}>
								<button onClick={() => onView(r)} style={{ marginRight: 8 }}>查看</button>
								<button onClick={() => onCancel(r)}>取消</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Requests;
