import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { handleCreateFeedback } from '../../api/feedbackAPI';
 
 
const Feedback = () => {
	const { user } = useAuth();
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [testRole, setTestRole] = useState(user?.role || '');
	const [uiRating, setUiRating] = useState(0);
	const [flowRating, setFlowRating] = useState(0);
	const [perfRating, setPerfRating] = useState(0);
	const hasAllRatings = uiRating > 0 && flowRating > 0 && perfRating > 0;
	const canSubmit = hasAllRatings && !submitting;

	useEffect(() => {
		if (user?.role && !testRole) {
			setTestRole(user.role);
		}
	}, [user, testRole]);

	const onSubmit = async () => {
		if (!hasAllRatings) {
			alert('請先為三個問題都評分再送出。');
			return;
		}
		setSubmitting(true);
		try {
			const ratingParts = [uiRating, flowRating, perfRating];
			const ratingString = ratingParts.join(';');
			const testingRoleToSave = (testRole && testRole.trim()) || 'N/A';
			const detail = message.trim();

			await handleCreateFeedback({
				message: detail, // 純文字描述
				rating: ratingString,
				testing_role: testingRoleToSave
			});
			console.log('feedback_submit', {
				testing_role: testingRoleToSave,
				rating: ratingString,
				message: detail,
				userId: user?.id,
				userName: user?.name,
				role: user?.role,
				createdAt: new Date().toISOString()
			});
			alert('已送出，謝謝你的回饋！');
			// 重新載入頁面以清空所有輸入與評分
			window.location.reload();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2 style={{ marginTop: 0 }}>回饋</h2>
				{user?.role?.toUpperCase() === 'ADMIN' && (
					<button
						style={{ marginLeft: 'auto' }}
						onClick={() => {
							// TODO: 導向 Feedback 列表頁或打 API 取得所有反饋
							console.log('View Feedbacks clicked by admin');
							alert('View Feedbacks 功能稍後補上列表頁，現在只是佔位按鈕。');
						}}
					>
						View Feedbacks
					</button>
				)}
			</div>
            <div style={{ marginTop: 12 }}>
				你可以在此回報任何使用上的問題或建議，幫助我們改進系統！
			</div>
			
			<div style={{ marginTop: 16, maxWidth: 720 }}>
				<div style={{ marginBottom: 12 }}>
					<label style={{ display: 'block', marginBottom: 4 }}>
						1. 你用什麼角色測試？
					</label>
					<select
						value={testRole}
						onChange={(e) => setTestRole(e.target.value)}
						style={{ padding: 6, minWidth: 200 }}
					>
						<option value="">請選擇角色</option>
						<option value="ADMIN">ADMIN</option>
						<option value="SALES">SALES</option>
						<option value="LEADER">LEADER</option>
						<option value="MEMBER">MEMBER</option>
					</select>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>2. UI是否清晰？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不清晰</span>
						<div>
							{[1,2,3,4,5].map((n) => (
								<span
									key={`ui-${n}`}
									style={{
										cursor: 'pointer',
										color: n <= uiRating ? '#f59e0b' : '#d1d5db',
										fontSize: 20,
										marginRight: 4
									}}
									onClick={() => setUiRating(n)}
								>
									★
								</span>
							))}
						</div>
						<span style={{ fontSize: 12, color: '#6b7280' }}>清晰</span>
					</div>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>3. 操作流程是否清晰？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不清晰</span>
						<div>
							{[1,2,3,4,5].map((n) => (
								<span
									key={`flow-${n}`}
									style={{
										cursor: 'pointer',
										color: n <= flowRating ? '#f59e0b' : '#d1d5db',
										fontSize: 20,
										marginRight: 4
									}}
									onClick={() => setFlowRating(n)}
								>
									★
								</span>
							))}
						</div>
						<span style={{ fontSize: 12, color: '#6b7280' }}>清晰</span>
					</div>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>4. 網頁是否流暢？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不流暢</span>
						<div>
							{[1,2,3,4,5].map((n) => (
								<span
									key={`perf-${n}`}
									style={{
										cursor: 'pointer',
										color: n <= perfRating ? '#f59e0b' : '#d1d5db',
										fontSize: 20,
										marginRight: 4
									}}
									onClick={() => setPerfRating(n)}
								>
									★
								</span>
							))}
						</div>
						<span style={{ fontSize: 12, color: '#6b7280' }}>流暢</span>
					</div>
				</div>
				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={6}
					placeholder="選填：描述你對平台的評價，建議或者遇到的問題（可包含頁面、操作步驟、錯誤訊息）"
					style={{ width: '100%', padding: 10, resize: 'vertical' }}
				/>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
					<button onClick={onSubmit} disabled={!canSubmit}>
						{submitting ? '送出中...' : '送出'}
					</button>
				</div>
			</div>
			
			
		</div>
	);
};

export default Feedback;