import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { searchInputStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
 
const Feedback = () => {
	const { user } = useAuth();

	return (
		<div style={{ padding: 20 }}>
			<h2 style={{ marginTop: 0 }}>Feedback</h2>
			<div style={{ color: '#666' }}>
				{user ? `使用者：${user.name}（${user.role}）` : ''}
			</div>
			<div style={{ marginTop: 12 }}>
				此頁面已建立並可從 Header 進入；內容可依需求再補上。
			</div>
		</div>
	);
};

export default Feedback;