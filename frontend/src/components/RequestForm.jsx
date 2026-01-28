import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { handleFindUserByRole } from '../api/customersListAPI';
import { handleConfirmEnrollmentByUser } from '../api/enrollmentAPI';
import { handleListEnrolledUpcomingSessions, handleListSessionsByEventId } from '../api/sessionAPI';

const baseForm = {
  type: '取消申請',
  reason: '',
  memberId: '',
  memberName: '',
  courseId: '',
  courseName: '',
  session: '',
  rescheduleSession: '',
  requestedDate: '',
  refund: false,
  note: ''
};

const RequestForm = ({ onSubmitted, requestType }) => {
  const [form, setForm] = useState({ ...baseForm, type: requestType || baseForm.type });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [memberError, setMemberError] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventInput, setEventInput] = useState('');
  const [eventError, setEventError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionInput, setSessionInput] = useState('');
  const [sessionError, setSessionError] = useState(null);
  const [rescheduleSessions, setRescheduleSessions] = useState([]);
  const [rescheduleSessionInput, setRescheduleSessionInput] = useState('');
  const [rescheduleSessionError, setRescheduleSessionError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // reset entire form and related inputs when request type changes
    setForm({ ...baseForm, type: requestType || baseForm.type });
    setMemberInput('');
    setMemberError(null);
    setEvents([]);
    setEventInput('');
    setEventError(null);
    setSessions([]);
    setSessionInput('');
    setSessionError(null);
    setRescheduleSessions([]);
    setRescheduleSessionInput('');
    setRescheduleSessionError(null);
  }, [requestType]);

  // load members list for selection
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await handleFindUserByRole('MEMBER');
        setMembers(res.customers || []);
      } catch (err) {
        console.error('Failed to load members list', err);
      }
    };
    fetchMembers();
  }, []);

  // autofill when current user is member
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'member') {
      setForm((f) => ({ ...f, memberId: user.id || '', memberName: user.name || '' }));
      setMemberInput(user.id ? `${user.id} - ${user.name || ''}` : '');
      setMemberError(null);
    }
  }, [user]);

  // fetch confirmed enrolled events for the selected member
  useEffect(() => {
    const loadEvents = async () => {
      if (!form.memberId) {
        setEvents([]);
        setEventInput('');
        setEventError(null);
        return;
      }
      try {
        const res = await handleConfirmEnrollmentByUser(form.memberId);
        const list = res?.enrollments || res?.events || res?.data || [];
        setEvents(list);
        setEventError(null);
      } catch (err) {
        console.error('Failed to load confirmed events for member', err);
        setEvents([]);
        setEventError('無法載入已確認的活動，請稍後再試');
      }
    };
    loadEvents();
  }, [form.memberId]);

  // fetch enrolled upcoming sessions (filtered by member and selected event) for certain request types
  useEffect(() => {
    const loadSessions = async () => {
      if (!form.memberId) {
        setSessions([]);
        setSessionInput('');
        setSessionError(null);
        return;
      }
      if (!form.courseId) {
        setSessions([]);
        setSessionInput('');
        setSessionError(null);
        return;
      }
      const needSession = isCancel || isLeave || isReschedule;
      if (!needSession) {
        setSessions([]);
        setSessionInput('');
        setSessionError(null);
        return;
      }
      try {
        const res = await handleListEnrolledUpcomingSessions(200, 0, String(form.memberId), form.courseId);
        const list = res?.sessions || res?.data || res?.items || [];
        setSessions(list);
        setSessionError(null);
      } catch (err) {
        console.error('Failed to load sessions for member', err);
        setSessions([]);
        setSessionError('無法載入已報名場次，請稍後再試');
      }
    };
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.memberId, form.courseId, form.type]);

  const isCancel = form.type === '取消申請';
  const isLeave = form.type === '請假申請';
  const isReschedule = form.type === '改期申請';
  const isMakeup = form.type === '補堂申請';
  const isRetake = form.type === '覆課申請';

  const reasonLabel = useMemo(() => {
    if (isCancel) return '取消原因';
    return '申請原因';
  }, [isCancel]);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const resetRescheduleSelection = (options = { clearOptions: false }) => {
    if (options.clearOptions) {
      setRescheduleSessions([]);
    }
    setRescheduleSessionInput('');
    setRescheduleSessionError(null);
    setForm((prev) => (prev.rescheduleSession ? { ...prev, rescheduleSession: '' } : prev));
  };

  useEffect(() => {
    const loadRescheduleSessions = async () => {
      if (!isReschedule || !form.courseId) {
        resetRescheduleSelection({ clearOptions: true });
        return;
      }

      try {
        const res = await handleListSessionsByEventId(form.courseId);
        const list = res?.sessions || [];
        setRescheduleSessions(list);
        setRescheduleSessionError(null);
      } catch (err) {
        console.error('Failed to load sessions for reschedule', err);
        setRescheduleSessions([]);
        setRescheduleSessionError('無法載入改期場次，請稍後再試');
      }
    };

    loadRescheduleSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.courseId, form.type]);

  const handleMemberInput = (val) => {
    setMemberInput(val);
    resetRescheduleSelection({ clearOptions: true });
    const match = members.find((m) => `${m.user_id} - ${m.name}` === val);
    if (match) {
      setForm((f) => ({ ...f, memberId: String(match.user_id), memberName: match.name }));
      setMemberError(null);
      setEventInput('');
      setEventError(null);
      setForm((f) => ({ ...f, courseId: '', courseName: '' }));
      setSessionInput('');
      setSessionError(null);
      setForm((f) => ({ ...f, session: '' }));
      return;
    }
    const trimmed = val.trim();
    if (trimmed === '') {
      setForm((f) => ({ ...f, memberId: '', memberName: '', courseId: '', courseName: '' }));
      setMemberError(null);
      setEventInput('');
      setEventError(null);
      setSessionInput('');
      setSessionError(null);
      setForm((f) => ({ ...f, session: '' }));
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      setForm((f) => ({ ...f, memberId: trimmed }));
      const exists = members.find((m) => String(m.user_id) === trimmed);
      if (exists) {
        setForm((f) => ({ ...f, memberId: trimmed, memberName: exists.name }));
        setMemberError(null);
        setEventInput('');
        setEventError(null);
        setForm((f) => ({ ...f, courseId: '', courseName: '' }));
        setSessionInput('');
        setSessionError(null);
        setForm((f) => ({ ...f, session: '' }));
      } else {
        setForm((f) => ({ ...f, memberName: '', courseId: '', courseName: '', session: '' }));
        setMemberError('此會員 ID 不在清單');
      }
    } else {
      setForm((f) => ({ ...f, memberId: '', memberName: '', courseId: '', courseName: '', session: '' }));
      setMemberError('請輸入會員 ID（數字），或從清單選擇');
    }
  };

  const handleEventInput = (val) => {
    setEventInput(val);
    resetRescheduleSelection({ clearOptions: true });
    const match = events.find((evt) => `${evt.event_id} - ${evt.event_name || evt.title || ''}`.trim() === val.trim());
    if (match) {
      setForm((f) => ({ ...f, courseId: String(match.event_id), courseName: match.event_name || match.title || '', session: '', requestedDate: '' }));
      setEventError(null);
      setSessionInput('');
      setSessionError(null);
      return;
    }
    const trimmed = val.trim();
    if (trimmed === '') {
      setForm((f) => ({ ...f, courseId: '', courseName: '', session: '', requestedDate: '' }));
      setEventError(null);
      setSessionInput('');
      setSessionError(null);
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      const exists = events.find((evt) => String(evt.event_id) === trimmed);
      if (exists) {
        setForm((f) => ({ ...f, courseId: trimmed, courseName: exists.event_name || exists.title || '', session: '', requestedDate: '' }));
        setEventError(null);
        setSessionInput('');
        setSessionError(null);
      } else {
        setForm((f) => ({ ...f, courseId: trimmed, courseName: '', session: '', requestedDate: '' }));
        setEventError('此活動不在會員的已確認清單');
      }
    } else {
      setForm((f) => ({ ...f, courseId: '', courseName: '', session: '', requestedDate: '' }));
      setEventError('請輸入活動 ID（數字），或從清單選擇');
    }
  };

  const formatSessionLabel = (session) => {
    const name = session.title || session.name || session.session_name || '';
    const start = session.datetime_start || session.start_time || session.startTime;
    if (!start) {
      return name.trim();
    }
    const dt = new Date(start);
    const datePart = `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
    const timePart = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    return `${name} (${datePart} ${timePart})`.trim();
  };

  const handleSessionInput = (val) => {
    setSessionInput(val);
    const match = sessions.find((s) => formatSessionLabel(s).trim() === val.trim());
    if (match) {
      setForm((f) => ({ ...f, session: match.session_id || match.id || '', requestedDate: match.start_time || match.startTime || '' }));
      setSessionError(null);
      return;
    }
    const trimmed = val.trim();
    if (trimmed === '') {
      setForm((f) => ({ ...f, session: '', requestedDate: '' }));
      setSessionError(null);
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      const exists = sessions.find((s) => String(s.session_id || s.id) === trimmed);
      if (exists) {
        setForm((f) => ({ ...f, session: trimmed, requestedDate: exists.start_time || exists.startTime || '' }));
        setSessionError(null);
      } else {
        setForm((f) => ({ ...f, session: trimmed, requestedDate: '' }));
        setSessionError('此場次不在會員的已報名清單');
      }
    } else {
      setForm((f) => ({ ...f, session: '', requestedDate: '' }));
      setSessionError('請輸入場次 ID（數字），或從清單選擇');
    }
  };

  const handleRescheduleSessionInput = (val) => {
    setRescheduleSessionInput(val);
    const match = rescheduleSessions.find((s) => formatSessionLabel(s).trim() === val.trim());
    if (match) {
      setForm((f) => ({ ...f, rescheduleSession: match.session_id || match.id || '' }));
      setRescheduleSessionError(null);
      return;
    }

    const trimmed = val.trim();
    if (trimmed === '') {
      setForm((f) => ({ ...f, rescheduleSession: '' }));
      setRescheduleSessionError(null);
      return;
    }

    if (/^\d+$/.test(trimmed)) {
      const exists = rescheduleSessions.find((s) => String(s.session_id || s.id) === trimmed);
      if (exists) {
        setForm((f) => ({ ...f, rescheduleSession: trimmed }));
        setRescheduleSessionError(null);
      } else {
        setForm((f) => ({ ...f, rescheduleSession: trimmed }));
        setRescheduleSessionError('此場次不在活動的可用場次內');
      }
    } else {
      setForm((f) => ({ ...f, rescheduleSession: '' }));
      setRescheduleSessionError('請輸入場次 ID（數字），或從清單選擇');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type) {
      alert('請選擇申請類型');
      return;
    }
    if (!form.memberId) {
      alert('請選擇或輸入會員');
      return;
    }
    if (!form.courseId) {
      alert('請選擇會員已確認的活動');
      return;
    }
    if ((isCancel || isLeave || isReschedule) && !form.session) {
      alert('請選擇會員已報名的場次');
      return;
    }
    if (isReschedule && !form.rescheduleSession) {
      alert('請選擇欲改期的目標場次');
      return;
    }
    setSaving(true);
    await new Promise((res) => setTimeout(res, 400));
    alert(
      `提交成功（示範）\n類型：${form.type}\n原因：${form.reason}\n課程：${form.courseId} ${form.courseName}\n場次：${form.session}\n申請日期：${form.requestedDate}\n退款需求：${isCancel ? (form.refund ? '是' : '否') : '不適用'}\n備註：${form.note}`
    );
    setSaving(false);
    if (onSubmitted) onSubmitted(form);
  };

  const handleClear = () => {
    setForm({ ...baseForm, type: form.type });
    setMemberInput('');
    setMemberError(null);
    setEvents([]);
    setEventInput('');
    setEventError(null);
    setSessions([]);
    setSessionInput('');
    setSessionError(null);
    resetRescheduleSelection({ clearOptions: true });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, maxWidth: 720 }}>
      <h2 style={{ margin: '0 0 12px' }}>{form.type}</h2>

      <div style={{ marginBottom: 10 }}>
        <label>會員</label>
        <br />
        {user?.role?.toLowerCase() === 'member' ? (
          <input value={memberInput || form.memberId} readOnly style={{ width: '100%', padding: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }} />
        ) : (
          <>
            <input
              list="member-list"
              value={memberInput}
              onFocus={() => {
                setMemberInput('');
                setForm((f) => ({ ...f, memberId: '', memberName: '' }));
                setMemberError(null);
                resetRescheduleSelection({ clearOptions: true });
              }}
              onClick={() => {
                setMemberInput('');
                setForm((f) => ({ ...f, memberId: '', memberName: '' }));
                setMemberError(null);
                resetRescheduleSelection({ clearOptions: true });
              }}
              onChange={(e) => handleMemberInput(e.target.value)}
              placeholder="輸入會員ID或從清單選擇"
              style={{ width: '20%', padding: 8, borderColor: memberError ? 'red' : '#e5e7eb' }}
            />
            <datalist id="member-list">
              {members.map((m) => (
                <option key={m.user_id} value={`${m.user_id} - ${m.name}`} />
              ))}
            </datalist>
            {memberError && <div style={{ color: 'red', marginTop: 4 }}>{memberError}</div>}
          </>
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>已確認報名的活動</label>
        <br />
        <input
          list="event-list"
          value={eventInput}
          onFocus={() => {
            setEventInput('');
            setForm((f) => ({ ...f, courseId: '', courseName: '' }));
            setEventError(null);
            resetRescheduleSelection({ clearOptions: true });
          }}
          onClick={() => {
            setEventInput('');
            setForm((f) => ({ ...f, courseId: '', courseName: '' }));
            setEventError(null);
            resetRescheduleSelection({ clearOptions: true });
          }}
          onChange={(e) => handleEventInput(e.target.value)}
          placeholder="選擇會員已確認的活動"
          style={{ width: '30%', padding: 8, borderColor: eventError ? 'red' : '#e5e7eb' }}
          disabled={!form.memberId}
        />
        <datalist id="event-list">
          {events.map((evt) => (
            <option key={evt.event_id} value={`${evt.event_id} - ${evt.event_name || evt.title || ''}`} />
          ))}
        </datalist>
        {eventError && <div style={{ color: 'red', marginTop: 4 }}>{eventError}</div>}
        {!eventError && form.memberId && events.length === 0 && (
          <div style={{ color: 'red', marginTop: 4 }}>此會員沒有已確認的活動。</div>
        )}
      </div>

      {(isCancel || isLeave || isReschedule) && (
        <div style={{ marginBottom: 10 }}>
          <label>已報名場次</label>
          <br />
          <input
            list="session-list"
            value={sessionInput}
            onFocus={() => {
              setSessionInput('');
              setForm((f) => ({ ...f, session: '', requestedDate: '' }));
              setSessionError(null);
            }}
            onClick={() => {
              setSessionInput('');
              setForm((f) => ({ ...f, session: '', requestedDate: '' }));
              setSessionError(null);
            }}
            onChange={(e) => handleSessionInput(e.target.value)}
            placeholder="選擇會員已報名的場次"
            style={{ width: '40%', padding: 8, borderColor: sessionError ? 'red' : '#e5e7eb' }}
            disabled={!form.memberId || !form.courseId}
          />
          <datalist id="session-list">
            {sessions.map((s) => (
              <option key={s.session_id || s.id} value={formatSessionLabel(s)} />
            ))}
          </datalist>
          {sessionError && <div style={{ color: 'red', marginTop: 4 }}>{sessionError}</div>}
          {!sessionError && form.memberId && !form.courseId && (
            <div style={{ color: '#6b7280', marginTop: 4 }}>請先選擇上方活動以載入場次。</div>
          )}
          {!sessionError && form.memberId && form.courseId && sessions.length === 0 && (
            <div style={{ color: 'red', marginTop: 4 }}>此會員暫無已報名場次。</div>
          )}
        </div>
      )}

      {isReschedule && (
        <div style={{ marginBottom: 10 }}>
          <label>改期場次</label>
          <br />
          <input
            list="reschedule-session-list"
            value={rescheduleSessionInput}
            onFocus={() => {
              setRescheduleSessionInput('');
              setForm((f) => ({ ...f, rescheduleSession: '' }));
              setRescheduleSessionError(null);
            }}
            onClick={() => {
              setRescheduleSessionInput('');
              setForm((f) => ({ ...f, rescheduleSession: '' }));
              setRescheduleSessionError(null);
            }}
            onChange={(e) => handleRescheduleSessionInput(e.target.value)}
            placeholder="選擇欲改期的場次"
            style={{ width: '40%', padding: 8, borderColor: rescheduleSessionError ? 'red' : '#e5e7eb' }}
            disabled={!form.courseId}
          />
          <datalist id="reschedule-session-list">
            {rescheduleSessions.map((s) => (
              <option key={s.session_id || s.id} value={formatSessionLabel(s)} />
            ))}
          </datalist>
          {rescheduleSessionError && <div style={{ color: 'red', marginTop: 4 }}>{rescheduleSessionError}</div>}
          {!rescheduleSessionError && form.courseId && rescheduleSessions.length === 0 && (
            <div style={{ color: 'red', marginTop: 4 }}>此活動目前沒有可供改期的場次。</div>
          )}
          {!rescheduleSessionError && !form.courseId && (
            <div style={{ color: '#6b7280', marginTop: 4 }}>請先於上方選擇活動以載入場次。</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button type='submit' disabled={saving} style={{ marginRight: 8 }}>{saving ? '提交中…' : '提交'}</button>
        <button type='button' onClick={handleClear}>清空</button>
      </div>
    </form>
  );
};

export default RequestForm;
