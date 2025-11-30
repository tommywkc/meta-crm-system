import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/BatchSessionStyles.css';
import { handleGetSessionById, handleUpdateSession } from '../../api/sessionAPI';
import { formatForDisplay, toISODateTime } from '../../utils/dateFormatter';

export default function SessionEdit() {
	const { id } = useParams(); // session_id
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Form state
	const [sessionName, setSessionName] = useState('');
	const [sessionDesc, setSessionDesc] = useState('');
	const [date, setDate] = useState(null);
	const [time, setTime] = useState('09:00');
	const [duration, setDuration] = useState(60);
	const [capacity, setCapacity] = useState('');

	const [eventId, setEventId] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				const payload = await handleGetSessionById(id);
				const s = payload?.session || payload;
				// Populate form
				setSessionName(s.session_name || '');
				setSessionDesc(s.description || '');
				// Parse start datetime into date + time
				const start = s.datetime_start ? new Date(s.datetime_start) : null;
				setDate(start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null);
				const hh = start ? String(start.getHours()).padStart(2, '0') : '09';
				const mm = start ? String(start.getMinutes()).padStart(2, '0') : '00';
				setTime(`${hh}:${mm}`);
				setDuration(s.duration_minutes ?? 60);
				setCapacity(s.capacity != null ? String(s.capacity) : '');
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		// Basic validation
		if (!sessionName.trim()) {
			alert('請輸入場次名稱');
			return;
		}
		if (!date) {
			alert('請選擇日期');
			return;
		}
		if (!time) {
			alert('請輸入時間');
			return;
		}

		const datetime_start = toISODateTime(date, time);
		if (!datetime_start) {
			alert('開始時間有誤');
			return;
		}
		// Compute end by adding duration minutes
		const startDT = new Date(datetime_start);
		const endDT = new Date(startDT.getTime() + (parseInt(duration, 10) || 60) * 60 * 1000);
		const datetime_end = endDT.toISOString();

		const data = {
			session_name: sessionName.trim(),
			description: sessionDesc || null, // backend field is 'description'
			capacity: capacity ? parseInt(capacity, 10) : null, // backend field is 'capacity'
			datetime_start,
			datetime_end,
		};

		try {
			await handleUpdateSession(id, data);
			alert('場次已更新');
			// Navigate back to event view
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
		if (eventId) {
			navigate(`/events/${eventId}`);
		} else {
			navigate(-1);
		}
	};

	if (loading) {
		return <div style={{ padding: 20 }}>載入中…</div>;
	}
	if (error) {
		return <div style={{ padding: 20, color: 'red' }}>錯誤：{error}</div>;
	}

	// Markup mirrors EventForm's session block styling
	return (
		<div style={{ padding: 20 }}>
			<h1>編輯場次</h1>
			<form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
				<div className="session-card">
					<div className="session-number">場次編號：{id}</div>

					<div className="session-name-block">
						<label className="session-name-label">場次名稱</label><br />
						<input
							type="text"
							placeholder="Session A, 第一堂課"
							value={sessionName}
							onChange={(e) => setSessionName(e.target.value)}
							className="batch-input-field"
							required
						/>
					</div>

					<div className="session-desc-block">
						<label className="session-name-label">描述</label><br />
						<textarea
							placeholder="此場次描述（選填）"
							value={sessionDesc}
							onChange={(e) => setSessionDesc(e.target.value)}
							className="session-description"
						/>
					</div>

					<div className="session-grid">
						<div>
							<label className="session-name-label">選擇日期</label>
							<div className="datepicker-container">
								<DatePicker
									selected={date}
									onChange={(d) => setDate(d)}
									inline
									dateFormat="yyyy-MM-dd"
									minDate={new Date()}
								/>
									<div style={{ marginTop: 8 }}>
										<label className="batch-section-label">目前選擇的日期：</label>
										<div className="selected-dates-container">
                                            <div className="date-tag">
                                                {date ? formatForDisplay(date.toISOString()) : '尚未選擇日期'}
                                            </div>
										</div>
									</div>
							</div>
						</div>

						<div>
							<label className="session-name-label">時間與時長</label>
							<div className="time-duration-row">
								<div className="time-input-wrap">
									<input
										type="time"
										value={time}
										onChange={(e) => setTime(e.target.value)}
										className="batch-input-field"
									/>
								</div>
								<div className="duration-wrapper">
									<input
										type="number"
										min="1"
										placeholder="60"
										value={duration}
										onChange={(e) => setDuration(parseInt(e.target.value, 10) || '')}
										className="duration-input"
									/>
									<span className="duration-suffix">分鐘</span>
								</div>
							</div>

							<div className="session-capacity-block" style={{ marginTop: 8 }}>
								<label className="session-name-label">可容納人數</label><br />
								<input
									type="text"
									inputMode="numeric"
									placeholder="例：60"
									value={capacity ?? ''}
									onChange={(e) => setCapacity(e.target.value)}
									className="batch-input-field"
									style={{ borderColor: (capacity && !/^\d*$/.test(capacity)) ? 'red' : '' }}
								/>
								{capacity && !/^\d*$/.test(capacity) && (
									<small style={{ color: 'red' }}>請僅輸入人數（整數）。</small>
								)}
							</div>

							<div className="session-actions">
								<button type="submit" className="session-save-button">儲存場次</button>
								<button type="button" onClick={handleCancel} className="session-delete-button" style={{ marginLeft: 8 }}>取消</button>
							</div>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}


