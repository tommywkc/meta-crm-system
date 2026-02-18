import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getTypeDisplay } from '../utils/dateFormatter';
import '../styles/BatchSessionStyles.css';
import { handleFindUsersByRoles } from '../api/customersListAPI';
import { 
  backendSessionsToFormState, 
  formSessionsToBackendPayload, 
  calculateEventDateTimes 
} from '../utils/sessionDateHelper';
import { commonSelectStyle } from '../styles/SelectStyles';
import { PageContainer, PageHeader } from './CommonPage';

const EventForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  submitButtonText = "提交",
  title = "活動表單",
  showEventId = false,
  showSessionForm = false,
  onDelete = null
}) => {
  const [name, setName] = useState(initialData.event_name || '');
  const [type, setType] = useState(initialData.type || '');
  // datetime_start and datetime_end will be calculated from sessions
  const [capacity, setCapacity] = useState(initialData.capacity);
  const [status, setStatus] = useState(initialData.status || 'SCHEDULED');
  const [location, setLocation] = useState(initialData.location || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [roomCost, setRoomCost] = useState(initialData.room_cost || '');
  const [promotionCost, setPromotionCost] = useState(initialData.promotion_cost || '');
  const [speakerId, setSpeakerId] = useState(initialData.speaker_id || '');
  const [speakerInput, setSpeakerInput] = useState('');
  const [speakerError, setSpeakerError] = useState(null);
  const [speakerCandidates, setSpeakerCandidates] = useState([]);
  const [price, setPrice] = useState(initialData.price || '');
  const [sessions, setSessions] = useState(
    backendSessionsToFormState(initialData.sessions)
  );


  // Sync form when switching to Edit mode or when new data is loaded
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setName(initialData.event_name || '');
      setType(initialData.type || '');
      // datetime_start and datetime_end will be calculated from sessions
      setCapacity(initialData.capacity || 60);
      setStatus(initialData.status || 'SCHEDULED');
      setLocation(initialData.location || '');
      setDescription(initialData.description || '');
      setRoomCost(initialData.room_cost || '');
      setPromotionCost(initialData.promotion_cost || '');
      setSpeakerId(initialData.speaker_id || '');
      setPrice(initialData.price || '');
      setSessions(backendSessionsToFormState(initialData.sessions));
    }
  }, [initialData]);

  // 載入可當講者的名單（ADMIN/LEADER/SALES）
  useEffect(() => {
    (async () => {
      try {
        const { customers } = await handleFindUsersByRoles(['ADMIN', 'LEADER', 'SALES']);
        setSpeakerCandidates(customers || []);
      } catch (err) {
        console.error('載入講者清單失敗:', err);
      }
    })();
  }, []);

  // 根據 speakerId（id）決定顯示文字
  useEffect(() => {
    if (!speakerId) {
      setSpeakerInput('');
      setSpeakerError(null);
      return;
    }
    const u = speakerCandidates.find(x => String(x.user_id) === String(speakerId));
    if (u) {
      setSpeakerInput(`${u.user_id} - ${u.name} (${u.role})`);
      setSpeakerError(null);
    } else {
      setSpeakerInput(String(speakerId));
      setSpeakerError('此講者 ID 不在講者清單');
    }
  }, [speakerId, speakerCandidates]);

  // Serialize datetimes when submitting the event form
  const handleSubmit = (e) => {
  e.preventDefault();

  // 驗證：必填欄位
  if (!name.trim()) {
    alert("請輸入活動名稱。");
    return;
  }
  if (!type || type.trim() === '') {
    alert("請選擇活動類型（課程或講座）。");
    return;
  }

  // 轉換多場次資料
  if (speakerError) {
    alert(speakerError);
    return;
  }
  
  // Convert form sessions to backend payload format
  const sessionsPayload = formSessionsToBackendPayload(sessions);
  
  // Calculate event datetime_start and datetime_end from sessions
  const { datetime_start, datetime_end } = calculateEventDateTimes(sessionsPayload);

  const formData = {
    event_name: name.trim(),
    type: type.trim(),
    datetime_start,
    datetime_end,
    capacity: parseInt(capacity, 10) || 60,
    status,
    location,
    description,
    promotion_cost: promotionCost ? parseFloat(promotionCost) : null,
    room_cost: roomCost ? parseInt(roomCost, 10) : null,
    speaker_id: speakerId ? parseInt(speakerId, 10) : null,
    price: price ? parseInt(price, 10) : null,
    sessions: sessionsPayload
  };
  onSubmit(formData);
};

  // 多場次操作
  const addSession = () => {
    setSessions(prev => ([{ session_name: '', dates: [], time: '09:00', duration_minutes: 60, session_description: '', session_capacity: capacity ?? 60 }, ...prev]));
  };
  const removeSession = (idx) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };
  const updateSession = (idx, field, value) => {
    setSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  

  return (
    <PageContainer>
      <PageHeader 
        title={title} 
        showBack={true} 
        onBack={onCancel} 
      />
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
        {showEventId && initialData.event_id && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>編輯活動 ID: </strong><br />
              <u>{initialData.event_id}</u>
            </p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>活動名稱:</label><br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>

          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>類型:</label><br />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ ...commonSelectStyle, width: '100%' }}
            >
              <option value="">-- 請選擇 --</option>
              <option value="CLASS">課程</option>
              <option value="SEMINAR">講座</option>
            </select>
          </div>

  {/* Note: 開始時間 and 結束時間 are automatically calculated from sessions */}

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
              }}placeholder="留空或輸入 ' 0 ' 表示免費"
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
              list="speaker-candidates"
              value={speakerInput}
              onChange={(e) => {
                const val = e.target.value;
                setSpeakerInput(val);
                const match = speakerCandidates.find(u => `${u.user_id} - ${u.name} (${u.role})` === val);
                if (match) {
                  setSpeakerId(String(match.user_id));
                  setSpeakerError(null);
                } else {
                  const trimmed = val.trim();
                  if (trimmed === '') {
                    setSpeakerId('');
                    setSpeakerError(null);
                    return;
                  }
                  if (/^\d+$/.test(trimmed)) {
                    setSpeakerId(trimmed);
                    const exists = speakerCandidates.some(u => String(u.user_id) === trimmed);
                    setSpeakerError(exists ? null : '此 ID 不在講者清單');
                  } else {
                    setSpeakerId('');
                    setSpeakerError('請輸入講者 ID（數字），或從清單選擇');
                  }
                }
              }}
              placeholder="輸入講者ID或從清單選擇"
              style={{ width: '100%', padding: 8, borderColor: speakerError ? 'red' : '' }}
            />
            <datalist id="speaker-candidates">
              {speakerCandidates.map(u => (
                <option key={u.user_id} value={`${u.user_id} - ${u.name} (${u.role})`} />
              ))}
            </datalist>
            {speakerError && (
              <small style={{ color: 'red' }}>{speakerError}</small>
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
                }}placeholder="留空或輸入 ' 0 ' 表示免費"
              />
            </div>
            {!/^\d*$/.test(roomCost || '') && (
              <small style={{ color: 'red' }}>請輸入有效的金額（僅限數字）。</small>
            )}
          </div>

          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>宣傳費:</label><br/>
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
                type="number"
                step="0.01"
                value={promotionCost ?? ''}
                onChange={(e) => setPromotionCost(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 20px',
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ flex: 1, marginBottom: 8 }}>
            <label>狀態:</label><br />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ ...commonSelectStyle, width: '100%' }}
            >
              <option value="SCHEDULED">已排程</option>
              <option value="CANCELLED">已取消</option>
              <option value="OPEN">開放中</option>
            </select>
          </div>
          
        </div>
        
        {showSessionForm && (
          <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label><strong>場次（可選）:</strong></label>
            <button type="button" onClick={addSession}>+ 新增場次</button>
          </div>

          {sessions.length > 0 ? (
            <div style={{ marginTop: 8, display: 'grid', rowGap: 12 }}>
              {sessions.map((s, idx) => {
                return (
                  <div key={idx} className="session-card">
                    <div className="session-number">場次 #{sessions.length - idx}</div>
                    <div className="session-name-block">
                      <label className="session-name-label">場次名稱</label><br/>
                      <input
                        type="text"
                        placeholder="Session A, 第一堂課"
                        value={s.session_name}
                        onChange={(e) => updateSession(idx, 'session_name', e.target.value)}
                        className="batch-input-field"
                        required
                      />
                    </div>
                    <div className="session-desc-block">
                      <label className="session-name-label">描述</label><br/>
                      <textarea
                        placeholder="此場次描述（選填）"
                        value={s.session_description}
                        onChange={(e) => updateSession(idx, 'session_description', e.target.value)}
                        className="session-description"
                      />
                    </div>

                    <div className="session-grid">
                      <div>
                        <label className="session-name-label">選擇多個日期</label>
                        <div className="datepicker-container">
                          <DatePicker
                            selected={null}
                            onChange={(dates) => updateSession(idx, 'dates', dates)}
                            selectsMultiple
                            selectedDates={s.dates}
                            inline
                            dateFormat="yyyy-MM-dd"
                            minDate={new Date()}
                          />
                        </div>

                        {(s.dates || []).length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <label className="batch-section-label">已選日期 ({(s.dates || []).length})：</label>
                            <div className="selected-dates-container">
                              {(s.dates || []).map((date, dIdx) => (
                                <div key={dIdx} className="date-tag">
                                  {new Date(date).toLocaleDateString('zh-TW')}
                                  <button
                                    type="button"
                                    onClick={() => updateSession(idx, 'dates', (s.dates || []).filter((_, i) => i !== dIdx))}
                                    className="date-tag-remove"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="session-name-label">時間與時長</label>
                        <div className="time-duration-row">
                          <div className="time-input-wrap">
                            <input
                              type="time"
                              value={s.time}
                              onChange={(e) => updateSession(idx, 'time', e.target.value)}
                              className="batch-input-field"
                            />
                          </div>
                          <div className="duration-wrapper">
                            <input
                              type="number"
                              min="1"
                              placeholder="60"
                              value={s.duration_minutes}
                              onChange={(e) => updateSession(idx, 'duration_minutes', parseInt(e.target.value, 10) || '')}
                              className="duration-input"
                            />
                            <span className="duration-suffix">分鐘</span>
                          </div>
                        </div>

                        <div className="session-capacity-block" style={{ marginTop: 8 }}>
                          <label className="session-name-label">可容納人數</label><br/>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="留空不限制人數"
                            value={s.session_capacity == null ? 60 : s.session_capacity}
                            onChange={(e) => updateSession(idx, 'session_capacity', e.target.value)}
                            className="batch-input-field"
                            style={{ borderColor: (s.session_capacity && !/^\d*$/.test(s.session_capacity)) ? 'red' : '' }}
                          />
                          {s.session_capacity && !/^\d*$/.test(s.session_capacity) && (
                            <small style={{ color: 'red' }}>請僅輸入人數（整數）。</small>
                          )}
                        </div>

                        <div className="session-actions">
                          <button type="button" onClick={() => removeSession(idx)} className="session-delete-button">刪除場次</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        )}



  {/* Action buttons */}
        <div style={{ marginTop: 16 }}>
          <button type="submit" style={{ marginRight: 8 }}>{submitButtonText}</button>
          <button type="button" onClick={onCancel} className="btn-secondary">取消</button>
          {onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(initialData.event_id)} 
              className="btn-danger"
              style={{ marginLeft: 8 }}
            >
              刪除
            </button>
          )}
        </div>
      </form>
    </PageContainer>
  );
};

export default EventForm;