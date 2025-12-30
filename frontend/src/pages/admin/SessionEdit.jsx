import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/BatchSessionStyles.css';
import { handleGetSessionById, handleUpdateSession } from '../../api/sessionAPI';
import SessionForm from '../../components/SessionForm';

export default function SessionEdit() {
	const { id } = useParams(); // session_id
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [sessionData, setSessionData] = useState(null);
	const [eventId, setEventId] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				const payload = await handleGetSessionById(id);
				const s = payload?.session || payload;
				setSessionData({ ...s, session_id: s.session_id });
				setEventId(s.event_id);
				setError(null);
			} catch (err) {
				console.error('載入場次失敗:', err);
				setError(err?.message || '載入場次失敗');
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	const handleSubmit = async (formData) => {
		try {
			await handleUpdateSession(id, formData);
			alert('場次已更新');
			if (eventId) {
				navigate(`/events/${eventId}`);
			} else {
				navigate(-1);
			}
		} catch (err) {
			console.error('更新場次失敗:', err);
			alert(err?.message || '更新場次失敗');
		}
	};

	const handleCancel = () => {
		navigate(-1);
	};

	if (loading) {
		return <div style={{ padding: 20 }}>載入中…</div>;
	}
	if (error) {
		return <div style={{ padding: 20, color: 'red' }}>錯誤：{error}</div>;
	}
	if (!sessionData) {
		return <div style={{ padding: 20 }}>找不到場次資料</div>;
	}

	return (
		<SessionForm
			title="編輯場次"
			submitButtonText="儲存場次"
			initialData={sessionData}
			eventId={eventId}
			showSessionId
			onSubmit={handleSubmit}
			onCancel={handleCancel}
		/>
	);
}


