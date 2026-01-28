import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/BatchSessionStyles.css';
import { formatForDisplay, toISODateTime, toLocalISOString } from '../utils/dateFormatter';

const SessionForm = ({
  title = '場次表單',
  submitButtonText = '儲存',
  initialData = {},
  eventId: propEventId = null,
  showSessionId = false,
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const [sessionName, setSessionName] = useState(initialData.session_name || '');
  const [sessionDesc, setSessionDesc] = useState(initialData.description || '');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState('');
  const [eventId, setEventId] = useState(propEventId || initialData.event_id || null);

  // sync from initialData when it changes (edit 模式)
  useEffect(() => {
    const s = initialData || {};
    setSessionName(s.session_name || '');
    setSessionDesc(s.description || '');

    const start = s.datetime_start ? new Date(s.datetime_start) : null;
    if (start) {
      setDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
      const hh = String(start.getHours()).padStart(2, '0');
      const mm = String(start.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
    } else {
      setDate(null);
      setTime('09:00');
    }

    setDuration(s.duration_minutes != null ? s.duration_minutes : 60);
    setCapacity(s.capacity != null ? String(s.capacity) : '');
    setEventId(propEventId || s.event_id || null);
  }, [initialData, propEventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const startDT = new Date(datetime_start);
    const mins = parseInt(duration, 10) || 60;
    const endDT = new Date(startDT.getTime() + mins * 60 * 1000);
    const datetime_end = toLocalISOString(endDT);

    const data = {
      session_name: sessionName.trim(),
      description: sessionDesc || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      datetime_start,
      datetime_end,
    };

    if (eventId) {
      data.event_id = eventId;
    }

    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{title}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
        <div className="session-card">
          {showSessionId && initialData.session_id && (
            <div className="session-number">場次編號：{initialData.session_id}</div>
          )}

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
                <button type="submit" className="session-save-button" disabled={loading}>
                  {loading ? '儲存中…' : submitButtonText}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="session-delete-button"
                  style={{ marginLeft: 8 }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SessionForm;
