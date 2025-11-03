import React, { useState, useEffect } from 'react';
import { formatForDisplay } from '../styles/dateFormatter';
import { redTextStyle } from '../styles/TableStyles';

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
    price: price ? parseInt(price, 10) : null
  };
  onSubmit(formData);
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
          <input
              type="text"
              value={price ?? ''}
              onChange={(e) => setPrice(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderColor: !/^\d*$/.test(price || '') ? 'red' : ''
              }}
            />
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

  {/* Status and room cost */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>場地費用:</label><br/>
            <input
              type="text"
              value={roomCost ?? ''}
              onChange={(e) => setRoomCost(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderColor: !/^\d*$/.test(roomCost || '') ? 'red' : ''
              }}
            />
            {!/^\d*$/.test(roomCost || '') && (
              <small style={{ color: 'red' }}>請輸入有效的金額（僅限數字）。</small>
            )}
          </div>

          <div style={{ flex: 1 }}>
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