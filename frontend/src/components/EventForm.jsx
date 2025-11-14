import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatForDisplay } from '../styles/dateFormatter';
import { redTextStyle } from '../styles/TableStyles';
import '../styles/BatchSessionStyles.css';

const EventForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  submitButtonText = "提交",
  title = "事件表單",
  showEventId = false,
  onDelete = null
}) => {
  const [name, setName] = useState(initialData.event_name || '');
  const [type, setType] = useState(initialData.type || '');
  const [datetimeStart, setDatetimeStart] = useState(
    initialData.datetime_start ? formatForDisplay(initialData.datetime_start) : ''
  );
  const [datetimeEnd, setDatetimeEnd] = useState(
    initialData.datetime_end ? formatForDisplay(initialData.datetime_end) : ''
  );
  const [capacity, setCapacity] = useState(initialData.capacity || 60);
  const [status, setStatus] = useState(initialData.status || 'SCHEDULED');
  const [location, setLocation] = useState(initialData.location || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [roomCost, setRoomCost] = useState(initialData.room_cost || '');
  const [speakerId, setSpeakerId] = useState(initialData.speaker_id || '');
  const [price, setPrice] = useState(initialData.price || '');
  const [sessions, setSessions] = useState(
    Array.isArray(initialData.sessions)
      ? initialData.sessions.map(s => ({
          session_name: s.session_name || '',
          datetime_start: s.datetime_start ? new Date(s.datetime_start).toISOString().slice(0, 16) : '',
          duration_minutes: s.duration_minutes || 60
        }))
      : []
  );

  // 日期多選狀態
  const [selectedDates, setSelectedDates] = useState([]);
  const [batchSessionName, setBatchSessionName] = useState('');
  const [batchStartTime, setBatchStartTime] = useState('09:00');
  const [batchDuration, setBatchDuration] = useState(60);

  // Sync form when switching to Edit mode or when new data is loaded
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setName(initialData.event_name || '');
      setType(initialData.type || '');
      setDatetimeStart(
        initialData.datetime_start ? new Date(initialData.datetime_start).toISOString().slice(0, 16) : ''
      );
      setDatetimeEnd(
        initialData.datetime_end ? new Date(initialData.datetime_end).toISOString().slice(0, 16) : ''
      );
      setCapacity(initialData.capacity || 60);
      setStatus(initialData.status || 'SCHEDULED');
      setLocation(initialData.location || '');
      setDescription(initialData.description || '');
      setRoomCost(initialData.room_cost || '');
      setSpeakerId(initialData.speaker_id || '');
      setPrice(initialData.price || '');
      setSessions(
        Array.isArray(initialData.sessions)
          ? initialData.sessions.map(s => ({
              session_name: s.session_name || '',
              datetime_start: s.datetime_start ? new Date(s.datetime_start).toISOString().slice(0, 16) : '',
              duration_minutes: s.duration_minutes || 60
            }))
          : []
      );
    }
  }, [initialData]);

  // Serialize datetimes when submitting the event form
  const handleSubmit = (e) => {
  e.preventDefault();

  // 驗證：結束時間不得早於開始時間
  if (datetimeStart && datetimeEnd && new Date(datetimeEnd) < new Date(datetimeStart)) {
    alert("結束時間不能早於開始時間，請重新選擇。");
    return; // prevent submission
  }

  // 轉換多場次資料
  const sessionsPayload = sessions
    .filter(s => s.datetime_start)
    .map(s => {
      const startDate = new Date(s.datetime_start);
      const endDate = new Date(startDate.getTime() + (s.duration_minutes || 60) * 60000);
      return {
        session_name: s.session_name || '',
        datetime_start: startDate.toISOString(),
        datetime_end: endDate.toISOString()
      };
    });

  const formData = {
    event_name: name.trim(),
    type: type.trim(),
    datetime_start: datetimeStart ? new Date(datetimeStart).toISOString() : null,
    datetime_end: datetimeEnd ? new Date(datetimeEnd).toISOString() : null,
    capacity: parseInt(capacity, 10) || 60,
    status,
    location,
    description,
    room_cost: roomCost ? parseInt(roomCost, 10) : null,
    speaker_id: speakerId ? parseInt(speakerId, 10) : null,
    price: price ? parseInt(price, 10) : null,
    sessions: sessionsPayload
  };
  onSubmit(formData);
};

  // 多場次操作
  const addSession = () => {
    setSessions(prev => ([...prev, { session_name: '', datetime_start: '', duration_minutes: 60 }]));
  };
  const removeSession = (idx) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };
  const updateSession = (idx, field, value) => {
    setSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // 日期多選功能
  const handleDateChange = (dates) => {
    setSelectedDates(dates);
  };

  const removeSelectedDate = (dateToRemove) => {
    setSelectedDates(prev => prev.filter(d => d.getTime() !== dateToRemove.getTime()));
  };

  const generateSessionsFromDates = () => {
    if (selectedDates.length === 0) {
      alert('請先選擇日期');
      return;
    }
    if (!batchStartTime) {
      alert('請設定開始時間');
      return;
    }

    const newSessions = selectedDates.map(date => {
      // 組合日期和時間
      const [hours, minutes] = batchStartTime.split(':');
      const datetime = new Date(date);
      datetime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      return {
        session_name: batchSessionName || '',
        datetime_start: datetime.toISOString().slice(0, 16),
        duration_minutes: batchDuration || 60
      };
    });

    setSessions(prev => [...prev, ...newSessions]);
    // 清空選擇
    setSelectedDates([]);
    setBatchSessionName('');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{title}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
        {showEventId && initialData.event_id && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Editing Event ID: </strong><br />
              <u>{initialData.event_id}</u>
            </p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>事件名稱:</label><br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>類型 (CLASS / SEMINAR):</label><br />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '103%', padding: 8 }}
            required
          >
            <option value="">請選擇</option>
            <option value="CLASS">CLASS</option>
            <option value="SEMINAR">SEMINAR</option>
          </select>
        </div>

  {/* Date/time inputs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label>開始時間:</label><br />
            <input
              type="datetime-local"
              value={datetimeStart}
              onChange={(e) => setDatetimeStart(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label>結束時間:</label><br />
            <input
              type="datetime-local"
              value={datetimeEnd}
              onChange={(e) => setDatetimeEnd(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
        </div>
        {datetimeStart && datetimeEnd && new Date(datetimeEnd) < new Date(datetimeStart) && (
            <small style={{ color: 'red' }}>結束時間不得早於開始時間。</small>
        )}

  {/* Location and description */}
        <div style={{ marginBottom: 12 }}>
          <label>地點:</label><br />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>價格:</label><br />
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}
            >
              $
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={price ?? ''}
              onChange={(e) => setPrice(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 20px', 
                borderColor: !/^\d*$/.test(price || '') ? 'red' : ''
              }}
            />
          </div>
          {!/^\d*$/.test(price || '') && (
            <small style={{ color: 'red' }}>請輸入有效的金額（僅限數字）。</small>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>描述:</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: 8, minHeight: 60 }}
          />
        </div>

  {/* Speaker and settings */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {/* Speaker ID field */}
          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>講者 ID:</label><br/>
            <input
              type="text"
              value={speakerId ?? ''}
              onChange={(e) => setSpeakerId(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderColor: !/^\d*$/.test(speakerId || '') ? 'red' : ''
              }}
            />
            {!/^\d*$/.test(speakerId || '') && (
              <small style={{ color: 'red' }}>請輸入有效的講者編號（僅限數字）。</small>
            )}
          </div>

          {/* Capacity field */}
          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>可容納人數:</label><br/>
            <input
              type="text"
              value={capacity ?? ''}
              onChange={(e) => setCapacity(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderColor: !/^\d*$/.test(capacity || '') ? 'red' : ''
              }}
            />
            {!/^\d*$/.test(capacity || '') && (
              <small style={{ color: 'red' }}>請僅輸入人數（整數）。</small>
            )}
          </div>
        </div>

        {/* 狀態與場地費 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>場地費用:</label><br/>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666'
                }}
              >
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={roomCost ?? ''}
                onChange={(e) => setRoomCost(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 20px',
                  borderColor: !/^\d*$/.test(roomCost || '') ? 'red' : ''
                }}
              />
            </div>
            {!/^\d*$/.test(roomCost || '') && (
              <small style={{ color: 'red' }}>請輸入有效的金額（僅限數字）。</small>
            )}
          </div>

          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>狀態:</label><br />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="OPEN">OPEN</option>
            </select>
          </div>
          
        </div>

        {/* 多場次設定（可選） */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label><strong>場次（可選）:</strong></label>
            <button type="button" onClick={addSession}>+ 新增單一場次</button>
          </div>

          {/* 日期多選區塊 */}
          <div className="batch-session-container">
            <h4 className="batch-session-title">快速建立多日場次</h4>
            
            <div className="batch-session-section">
              <label className="batch-section-label">選擇多個日期:</label>
              <div className="batch-calendar-wrapper">
                <DatePicker
                  selected={null}
                  onChange={handleDateChange}
                  selectsMultiple
                  selectedDates={selectedDates}
                  inline
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                />
              </div>
            </div>

            {selectedDates.length > 0 && (
              <div className="batch-session-section">
                <label className="batch-section-label">
                  已選日期 ({selectedDates.length})：
                </label>
                <div className="selected-dates-container">
                  {selectedDates.map((date, idx) => (
                    <div key={idx} className="date-tag">
                      {date.toLocaleDateString('zh-TW')}
                      <button
                        type="button"
                        onClick={() => removeSelectedDate(date)}
                        className="date-tag-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="batch-input-grid">
              <div className="batch-input-group">
                <label className="batch-input-label">場次名稱（選填）</label>
                <input
                  type="text"
                  placeholder="例：週三課程"
                  value={batchSessionName}
                  onChange={(e) => setBatchSessionName(e.target.value)}
                  className="batch-input-field"
                />
              </div>
              <div className="batch-input-group">
                <label className="batch-input-label">開始時間</label>
                <input
                  type="time"
                  value={batchStartTime}
                  onChange={(e) => setBatchStartTime(e.target.value)}
                  className="batch-input-field"
                />
              </div>
              <div className="batch-input-group">
                <label className="batch-input-label">時長（分鐘）</label>
                <input
                  type="number"
                  min="1"
                  value={batchDuration}
                  onChange={(e) => setBatchDuration(parseInt(e.target.value, 10) || 60)}
                  className="batch-input-field"
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={generateSessionsFromDates}
              disabled={selectedDates.length === 0}
              className="batch-generate-button"
            >
              ✓ 為 {selectedDates.length} 個日期建立場次
            </button>
          </div>

          {sessions.length > 0 && (
            <div style={{ marginTop: 8, display: 'grid', rowGap: 12 }}>
              {sessions.map((s, idx) => {
                return (
                  <div key={idx} style={{ padding: 12, border: '1px solid #e0e0e0', borderRadius: 4 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: '#555' }}>場次名稱</label><br/>
                      <input
                        type="text"
                        placeholder="例：Session A, 第一堂課"
                        value={s.session_name}
                        onChange={(e) => updateSession(idx, 'session_name', e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: '#555' }}>開始時間</label><br/>
                        <input
                          type="datetime-local"
                          value={s.datetime_start}
                          onChange={(e) => updateSession(idx, 'datetime_start', e.target.value)}
                          style={{ width: '100%', padding: 8 }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: '#555' }}>時長（分鐘）</label><br/>
                        <input
                          type="number"
                          min="1"
                          placeholder="60"
                          value={s.duration_minutes}
                          onChange={(e) => updateSession(idx, 'duration_minutes', parseInt(e.target.value, 10) || '')}
                          style={{ width: '100%', padding: 8 }}
                        />
                      </div>
                      <button type="button" onClick={() => removeSession(idx)} style={{ padding: '8px 12px' }}>刪除</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

  {/* Action buttons */}
        <div style={{ marginTop: 16 }}>
          <button type="submit" style={{ marginRight: 8 }}>{submitButtonText}</button>
          <button type="button" onClick={onCancel}>取消</button>
          {onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(initialData.event_id)} 
              style={{ ...redTextStyle, marginLeft: 8 }}
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventForm;