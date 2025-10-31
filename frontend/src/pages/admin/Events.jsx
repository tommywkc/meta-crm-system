import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockClasses = [
	{
		id: 'E1',
		name: 'AI Animation 9A',
		category: '課堂',
		schedule: '2025-11-12 19:00',
		seatsLimit: 60,
		remainingSeats: 4,
		status: '公開'
	},
	{
		id: 'E2',
		name: 'Seminar-SEP-03',
		category: '講座',
		schedule: '2025-09-03 14:00',
		seatsLimit: null,
		remainingSeats: null,
		status: '草稿'
	}
];

const Events = () => {
	const navigate = useNavigate();
	const onCreate = () => {
		// navigate to create page
		navigate('/events/create');
	};
	const onEdit = (id) => {
		// navigate to edit page
		navigate(`/events/${id}/edit`);
	};
	const onView = (id) => {
		// navigate to view page
		navigate(`/events/${id}`);
	};

		return (
			<div style={{ padding: 20 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<h1 style={{ margin: 0 }}>建立/編輯講座與課堂 (Admin)</h1>
				
					</div>
					<div>
						<button onClick={onCreate}>建立</button>
					</div>
				</div>

				<table style={tableStyle}>
				<thead>
					<tr>
						<th style={thTdStyle}>名稱</th>
						<th style={thTdStyle}>類別</th>
						<th style={thTdStyle}>場次/時間</th>
						<th style={thTdStyle}>剩餘名額</th>
						<th style={thTdStyle}>狀態</th>
						<th style={thTdStyle}>動作</th>
					</tr>
				</thead>
				<tbody>
					{mockClasses.map((c) => (
						<tr key={c.id}>
							<td style={thTdStyle}>{c.name}</td>
							<td style={thTdStyle}>{c.category}</td>
							<td style={thTdStyle}>{c.schedule}</td>
							<td style={thTdStyle}>{c.remainingSeats != null ? `餘 ${c.remainingSeats}` : ''}</td>
							<td style={thTdStyle}>{c.status}</td>
							<td style={thTdStyle}>
								<button onClick={() => onView(c.id)} style={{ marginRight: 8 }}>查看</button>
								<button onClick={() => onEdit(c.id)} style={{ marginRight: 8 }}>編輯</button>
								<button onClick={() => alert(`刪除 ${c.id}（模擬）`)}>刪除</button>
							</td>
						</tr>
					))}
				</tbody>
					</table>
				</div>
	);
};

export default Events;
