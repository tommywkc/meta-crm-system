import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { UpperSelectContainerStyle, LowerSelectContainerStyle } from '../../styles/SelectStyles';

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
	const { user } = useAuth();
	const userRole = user?.role?.toLowerCase();
	const isAdmin = userRole === 'admin';
	const isMember = userRole === 'member';
	const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
	
	// 分頁和搜尋狀態
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);
	const [searchTerm, setSearchTerm] = useState('');
	
	// 過濾講座數據
	const filteredEvents = mockClasses.filter(event => 
		event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		event.category.toLowerCase().includes(searchTerm.toLowerCase())
	);
	
	// 分頁計算
	const startIndex = (page - 1) * limit;
	const pagedEvents = filteredEvents.slice(startIndex, startIndex + limit);
	
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
	const onEnroll = (id) => {
		// member enrollment logic
		alert(`報名 ${id}（模擬）`);
	};

		return (
			<div style={{ padding: 20 }}>
				<h1>
					{isAdmin ? '建立/編輯講座與課堂 (Admin)' : 
					 isSalesOrLeader ? `講座與課堂名單 (${user.role})` :
					 '講座與課堂名單 (Member)'}
				</h1>
				<p>管理講座與課堂數據和操作。</p>

				{isAdmin && (
					<button onClick={onCreate}>
						Create New Event
					</button>
				)}

				<input 
					type="text" 
					placeholder="search..." 
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setPage(1); // 重置到第一頁
					}}
				/>

				<div style={UpperSelectContainerStyle}>
					<label>
						Page:&nbsp;
						<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
							{Array.from({ length: Math.max(1, Math.ceil(filteredEvents.length / limit)) }, (_, i) => (
								<option key={i + 1} value={i + 1}>{i + 1}</option>
							))}
						</select>
					</label>

					<label>
						Items per page:&nbsp;
						<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</label>
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
					{pagedEvents.map((c) => (
						<tr key={c.id}>
							<td style={thTdStyle}>{c.name}</td>
							<td style={thTdStyle}>{c.category}</td>
							<td style={thTdStyle}>{c.schedule}</td>
							<td style={thTdStyle}>{c.remainingSeats != null ? `餘 ${c.remainingSeats}` : ''}</td>
							<td style={thTdStyle}>{c.status}</td>
							<td style={thTdStyle}>
								<button onClick={() => onView(c.id)}>Details</button>
								{isAdmin ? (
									<>
										<button onClick={() => onEdit(c.id)} style={{ marginLeft: 8 }}>Edit</button>
										<button onClick={() => alert(`刪除 ${c.id}（模擬）`)} style={{ marginLeft: 8 }}>Delete</button>
									</>
								) : isMember ? (
									<button onClick={() => onEnroll(c.id)} style={{ marginLeft: 8 }}>報名</button>
								) : (
									// sales/leader 只能查看，不顯示其他按鈕
									null
								)}
							</td>
						</tr>
					))}
				</tbody>
					</table>

				<div style={LowerSelectContainerStyle}>
					<label>
						Page:&nbsp;
						<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
							{Array.from({ length: Math.max(1, Math.ceil(filteredEvents.length / limit)) }, (_, i) => (
								<option key={i + 1} value={i + 1}>{i + 1}</option>
							))}
						</select>
					</label>
				</div>
			</div>
	);
};

export default Events;
