import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { handleCreateFeedback } from '../../api/feedbackAPI';
 
 
const Feedback = () => {
	const { user } = useAuth();
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const canSubmit = message.trim().length > 0 && !submitting;

	const onSubmit = async () => {
		if (!message.trim()) return;
		setSubmitting(true);
		try {
            await handleCreateFeedback({ message: message.trim() });
			console.log('feedback_submit', {
				message: message.trim(),
				userId: user?.id,
				userName: user?.name,
				role: user?.role,
				createdAt: new Date().toISOString()
			});
			alert('已送出，謝謝你的回饋！');
			setMessage('');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2 style={{ marginTop: 0 }}>Feedback</h2>
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
				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={6}
					placeholder="請描述你遇到的問題/建議（可包含頁面、操作步驟、錯誤訊息）"
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