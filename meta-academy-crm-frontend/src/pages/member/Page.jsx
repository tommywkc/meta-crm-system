import React from 'react';
import Calendar from '../../components/Calendar';

function formatKey(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

const MemberPage = () => {
	const today = new Date();
	const todayKey = formatKey(today);
	const events = {
		[todayKey]: ['會議：團隊同步 10:00', '提醒：本週作業截止'],
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>會員主頁</h1>
			<p>這是會員的主要工作區。</p>

			<div style={{ marginTop: 16 }}>
				<Calendar events={events} />
			</div>
		</div>
	);
};

export default MemberPage;
