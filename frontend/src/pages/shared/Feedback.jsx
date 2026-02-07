import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleCreateFeedback } from '../../api/feedbackAPI';
import { commonSelectStyle } from '../../styles/SelectStyles';
 
 
const Feedback = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [testRole, setTestRole] = useState(user?.role || '');
	const [uiRating, setUiRating] = useState(0);
	const [flowRating, setFlowRating] = useState(0);
	const [perfRating, setPerfRating] = useState(0);
	const [functionRankings, setFunctionRankings] = useState([
		{ id: 'customer', name: '客戶管理', rank: 1 },
		{ id: 'event', name: '課堂 / 活動報名', rank: 2 },
		{ id: 'schedule', name: '行程', rank: 3 },
		{ id: 'payment', name: '收款與支付', rank: 4 },
		{ id: 'attendance', name: '出席 / 簽到', rank: 5 },
		{ id: 'request', name: '申請和審批', rank: 6 },
		{ id: 'report', name: '報表', rank: 7 }
	]);
	const hasAllRatings = uiRating > 0 && flowRating > 0 && perfRating > 0;
	const canSubmit = hasAllRatings && !submitting;

	const handleDragStart = (event, fromIndex) => {
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', String(fromIndex));
	};

	const handleDrop = (event, toIndex) => {
		event.preventDefault();
		const fromIndex = Number(event.dataTransfer.getData('text/plain'));
		if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
		setFunctionRankings((prev) => {
			const updated = [...prev];
			const [moved] = updated.splice(fromIndex, 1);
			updated.splice(toIndex, 0, moved);
			return updated;
		});
	};

	const handleDragOver = (event) => {
		event.preventDefault();
	};

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
			window.location.reload();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2 style={{ marginTop: 0 }}>意見回饋</h2>
				{user?.role?.toUpperCase() === 'ADMIN' && (
					<button
						style={{ marginLeft: 'auto' }}
							onClick={() => {
								console.log('View Feedbacks clicked by admin');
								navigate('/admin/feedbacks');
							}}
					>
						查看所有回饋
					</button>
				)}
			</div>
			<div style={{ marginTop: 12 , color: '#f59e0b' }}>
				*選填為項目
			</div>
			<div style={{ marginTop: 16, maxWidth: 720 }}>
				<div style={{ marginBottom: 12 }}>
					<label style={{ display: 'block', marginBottom: 4 }}>
						1. 你用什麼角色測試？
					</label>
					<select
						value={testRole}
						onChange={(e) => setTestRole(e.target.value)}
						style={{ ...commonSelectStyle, minWidth: 200 }}
					>
						<option value="">請選擇角色</option>
						<option value="ADMIN">ADMIN</option>
						<option value="SALES">SALES</option>
						<option value="LEADER">LEADER</option>
						<option value="MEMBER">MEMBER</option>
					</select>
				</div>

				<div style={{ marginBottom: 12 }}>
					<label style={{ display: 'block', marginBottom: 4 }}>
						2. 年齡層（選填）<span style={{ color: '#f59e0b', marginLeft: 4 }}>*</span>
					</label>
					<select
						defaultValue=""
						style={{ ...commonSelectStyle, minWidth: 200 }}
					>
						<option value="" disabled>請選擇年齡層</option>
						<option value="under18">18 歲以下</option>
						<option value="18-30">18 - 30 歲</option>
						<option value="31-40">31 - 40 歲</option>
						<option value="41-50">41 - 50 歲</option>
						<option value="51-60">51 - 60 歲</option>
						<option value="61-70">61 - 70 歲</option>
						<option value="70plus">70 歲以上</option>
					</select>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>3. UI介面是否清晰？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太清晰</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常清晰</span>
					</div>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>4. UI介面能否吸引用戶？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太吸引</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常吸引</span>
					</div>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>5. 操作流程是否清晰？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太清晰</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常清晰</span>
					</div>
				</div>

				<div style={{ marginBottom: 8 }}>
					<div>6. 網頁操作是否流暢？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太流暢</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常流暢</span>
					</div>
				</div>
				

				
				<div style={{ marginBottom: 8 }}>
					<div>7. 這個系統能否有效率的幫助運作？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太有效</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常有效</span>
					</div>
				</div>
				<div style={{ marginBottom: 8 }}>
					<div>8. 課堂報名簽到系統是否有效？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太有效</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常有效</span>
					</div>
				</div>
				<div style={{ marginBottom: 8 }}>
					<div>9. 收款系統設計是否完善有效？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太完善</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常完善</span>
					</div>
				</div>
				<div style={{ marginBottom: 8 }}>
					<div>10. 使用此平台後是否比以往方便？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>改變不大</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>方便很多</span>
					</div>
				</div>
				<div style={{ marginBottom: 8 }}>
					<div>11. 此平台後是否能幫助到用戶？</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: '#6b7280' }}>不太幫助</span>
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
						<span style={{ fontSize: 12, color: '#6b7280' }}>非常幫助</span>
					</div>
				</div>
				<div style={{ marginBottom: 8 }}>
						12. 請將以下功能依「使用頻率」從 1（最常用）排到 5（最少用）
				</div>
				<div style={{ marginBottom: 12, marginTop: 8, padding: 12, backgroundColor: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
					
					<div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
						拖曳每一列以調整順序
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
						{functionRankings.map((func, index) => (
							<div
								key={func.id}
								draggable
								onDragStart={(e) => handleDragStart(e, index)}
								onDragOver={handleDragOver}
								onDrop={(e) => handleDrop(e, index)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 12,
									padding: 8,
									backgroundColor: 'white',
									borderRadius: 4,
									border: '1px solid #d1d5db',
									cursor: 'grab'
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span style={{ fontWeight: 'bold', color: '#6366f1', minWidth: 24 }}>#{index + 1}</span>
									<span>{func.name}</span>
								</div>
								
							</div>
						))}
					</div>
				</div>
				<div style={{ marginBottom: 8 }}>
					13. 其他意見：<span style={{ color: '#f59e0b', marginLeft: 4 }}>*</span>
				</div>
				<div style={{ marginTop: 12 }}>
				你可以在此回報任何使用上的問題或建議，幫助我們改進系統！
			</div>
				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={6}
					placeholder="選填：描述你對平台的想法、建議或遇到的問題（可以包含頁面、操作步驟、錯誤訊息）"
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