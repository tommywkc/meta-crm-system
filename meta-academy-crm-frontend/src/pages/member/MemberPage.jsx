import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Calendar from '../../components/Calendar';

const MemberPage = () => {
	const { user, logout } = useAuth();

	// sample events: keys are YYYY-MM-DD
	const sampleEvents = {
		'2025-05-08': ['5月8號：交功課 - 提交報告A'],
	};

	// add today's sample event
	const today = new Date();
	const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
	sampleEvents[todayKey] = sampleEvents[todayKey] || [];
	sampleEvents[todayKey].push('今日：線上課程 14:00');

	return (
		<div style={{ padding: '20px' }}>


			<h2>我的行事曆</h2>
			<Calendar events={sampleEvents} />
		</div>
	);
};

export default MemberPage;
