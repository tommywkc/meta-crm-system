import React from 'react';
import Calendar from '../../components/Calendar';

function formatKey(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

const MemberCalendarPage = () => {
	const today = new Date();
	const todayKey = formatKey(today);

	// Generate mock events for the calendar
	const events = {
		[todayKey]: ['課堂: XXXXX', '課堂: XXXXXX'],
	};

	return (
		<div>
			<h1>我的日曆</h1>

			<section>
				<h2>課程日曆</h2>
				<div>
					<Calendar events={events} />
				</div>
			</section>
		</div>
	);
};

export default MemberCalendarPage;
