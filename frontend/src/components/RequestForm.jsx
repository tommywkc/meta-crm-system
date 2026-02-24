import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { handleFindUserByRole } from '../api/customersListAPI';
import { handleConfirmEnrollmentByUser } from '../api/enrollmentAPI';
import { handleListEnrolledUpcomingSessions, handleListSessionsByEventId } from '../api/sessionAPI';
import { handleSubmitRequest, handleListRequests, handleCancelRequestById } from '../api/requestsAPI';

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
  cancelRequestId: ''
};

const RequestForm = ({ onSubmitted, requestType }) => {
  const [form, setForm] = useState({ ...baseForm, type: requestType || baseForm.type });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [memberError, setMemberError] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventInput, setEventInput] = useState('');
  const [eventError, setEventError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionInput, setSessionInput] = useState('');
  const [sessionError, setSessionError] = useState(null);
  const [rescheduleSessions, setRescheduleSessions] = useState([]);
  const [rescheduleSessionInput, setRescheduleSessionInput] = useState('');
  const [rescheduleSessionError, setRescheduleSessionError] = useState(null);
  const [cancelOptions, setCancelOptions] = useState([]);
  const [cancelInput, setCancelInput] = useState('');
  const [cancelError, setCancelError] = useState(null);
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const isMemberUser = userRole === 'member';

  useEffect(() => {
    // reset entire form and related inputs when request type changes
    setForm((prev) => ({
      ...baseForm,
      type: requestType || baseForm.type,
      memberId: prev.memberId,
      memberName: prev.memberName
    }));
    if (!isMemberUser) {
      setMemberInput('');
      setMemberError(null);
    }
    setEvents([]);
    setEventsLoading(false);
    setEventInput('');
    setEventError(null);
    setSessions([]);
    setSessionsLoading(false);
    setSessionInput('');
    setSessionError(null);
    setRescheduleSessions([]);
    setRescheduleSessionInput('');
    setRescheduleSessionError(null);
    setCancelInput('');
    setCancelError(null);
  }, [requestType, isMemberUser]);

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
    if (isMemberUser) {
      setForm((f) => ({ ...f, memberId: user.id || '', memberName: user.name || '' }));
      setMemberInput(user.id ? `${user.id} - ${user.name || ''}` : '');
      setMemberError(null);
    }
  }, [isMemberUser, user]);

  // fetch confirmed enrolled events for the selected member
  useEffect(() => {
    const loadEvents = async () => {
      if (!form.memberId) {
        setEvents([]);
        setEventInput('');
        setEventError(null);
        setEventsLoading(false);
        return;
      }
      try {
        setEventsLoading(true);
        const res = await handleConfirmEnrollmentByUser(form.memberId);
        const list = res?.enrollments || res?.events || res?.data || [];
        setEvents(list);
        setEventError(null);
        setEventsLoading(false);
      } catch (err) {
        console.error('Failed to load confirmed events for member', err);
        setEvents([]);
        setEventError('無法載入已確認的活動，請稍後再試');
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, [form.memberId]);

  const isCancel = form.type === '取消申請';
  const isLeave = form.type === '請假申請';
  const isReschedule = form.type === '改期申請';
  const isMakeup = form.type === '補堂申請';
  const isRetake = form.type === '覆課申請';

  // fetch enrolled upcoming sessions (filtered by member and selected event) for certain request types
  useEffect(() => {
    const loadSessions = async () => {
      if (!form.memberId) {
        setSessions([]);
        setSessionsLoading(false);
        setSessionInput('');
        setSessionError(null);
        return;
      }
      if (!form.courseId) {
        setSessions([]);
        setSessionsLoading(false);
        setSessionInput('');
        setSessionError(null);
        return;
      }
      const needSession = isCancel || isLeave || isReschedule;
      if (!needSession) {
        setSessions([]);
        setSessionsLoading(false);
        setSessionInput('');
        setSessionError(null);
        return;
      }
      try {
        setSessionsLoading(true);
        const queryValue = isMemberUser ? '' : String(form.memberId);
        const res = await handleListEnrolledUpcomingSessions(200, 0, queryValue, form.courseId);
        const list = res?.sessions || res?.data || res?.items || [];
        setSessions(list);
        setSessionError(null);
        setSessionsLoading(false);
      } catch (err) {
        console.error('Failed to load sessions for member', err);
        setSessions([]);
        setSessionError('無法載入已報名場次，請稍後再試');
        setSessionsLoading(false);
      }
    };
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.memberId, form.courseId, form.type, isMemberUser, isCancel, isLeave, isReschedule]);

  useEffect(() => {
    const loadCancelableRequests = async () => {
      if (!isCancel) {
        setCancelOptions([]);
        return;
      }
      if (!form.memberId) {
        setCancelOptions([]);
        return;
      }
      try {
        const res = await handleListRequests();
        const list = res?.requests || [];
        const filtered = list.filter((req) => {
          const isPending = (req?.status || '').toString().toUpperCase() === 'PENDING';
          const sameUser = String(req?.user_id) === String(form.memberId);
          return isPending && sameUser;
        });
        const options = filtered.map((req) => {
          const typeLabel = req.request_type || '-';
          const sessionName = req.new_session_name || req.old_session_name || '-';
          const eventName = req.new_event_name || req.old_event_name || '-';
          return {
            id: req.request_id,
            label: `#${req.request_id} ${typeLabel} - ${eventName} / ${sessionName}`.trim(),
          };
        });
        setCancelOptions(options);
      } catch (err) {
        console.error('Failed to load cancelable requests', err);
        setCancelOptions([]);
      }
    };

    loadCancelableRequests();
  }, [form.memberId, isCancel]);


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
      if (!(isReschedule || isMakeup || isRetake) || !form.courseId) {
        resetRescheduleSelection({ clearOptions: true });
        return;
      }

      try {
        const res = await handleListSessionsByEventId(form.courseId);
        const list = res?.sessions || [];
        setRescheduleSessions(list);
        setRescheduleSessionError(null);
      } catch (err) {
        console.error('Failed to load sessions for reschedule/makeup/retake', err);
        setRescheduleSessions([]);
        setRescheduleSessionError('無法載入可選場次，請稍後再試');
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

  const handleCancelRequestInput = (val) => {
    setCancelInput(val);
    const match = cancelOptions.find((opt) => opt.label === val);
    if (match) {
      setForm((f) => ({ ...f, cancelRequestId: String(match.id) }));
      setCancelError(null);
      return;
    }
    setForm((f) => ({ ...f, cancelRequestId: val?.trim() || '' }));
    setCancelError(null);
  };

  const handleRescheduleSessionInput = (val) => {
    setRescheduleSessionInput(val);
    const currentSessionId = form.session ? String(form.session) : null;
    const match = rescheduleSessions.find((s) => formatSessionLabel(s).trim() === val.trim());
    if (match) {
      const matchId = String(match.session_id || match.id || '');
      if (currentSessionId && matchId === currentSessionId) {
        setForm((f) => (f.rescheduleSession ? { ...f, rescheduleSession: '' } : f));
        setRescheduleSessionError('請選擇不同於原場次的目標場次');
        return;
      }
      setForm((f) => ({ ...f, rescheduleSession: matchId }));
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
      if (currentSessionId && trimmed === currentSessionId) {
        setForm((f) => (f.rescheduleSession ? { ...f, rescheduleSession: '' } : f));
        setRescheduleSessionError('請選擇不同於原場次的目標場次');
        return;
      }
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
    if (!isMemberUser) {
      const memberExists = members.some((m) => String(m.user_id) === String(form.memberId));
      if (!memberExists) {
        setMemberError('請從清單內選擇會員');
        alert('請從清單內選擇會員');
        return;
      }
    }
    if (!isCancel && !form.courseId) {
      alert('請選擇會員已確認的活動');
      return;
    }
    if (!isCancel) {
      const eventExists = events.some((evt) => String(evt.event_id) === String(form.courseId));
      if (!eventExists) {
        setEventError('請從清單內選擇活動');
        alert('請從清單內選擇活動');
        return;
      }
    }
    if (isCancel) {
      if (!form.cancelRequestId) {
        setCancelError('請選擇要取消的申請');
        alert('請選擇要取消的申請');
        return;
      }
      const exists = cancelOptions.some((opt) => String(opt.id) === String(form.cancelRequestId));
      if (!exists) {
        setCancelError('請從清單內選擇申請');
        alert('請從清單內選擇申請');
        return;
      }
    }
    if ((isLeave || isReschedule) && !form.session) {
      alert('請選擇會員已報名的場次');
      return;
    }
    if ((isLeave || isReschedule) && form.session) {
      const sessionExists = sessions.some((s) => String(s.session_id || s.id) === String(form.session));
      if (!sessionExists) {
        setSessionError('請從清單內選擇場次');
        alert('請從清單內選擇場次');
        return;
      }
    }
    if ((isReschedule || isMakeup || isRetake) && !form.rescheduleSession) {
      const label = isReschedule ? '欲改期的目標場次' : isMakeup ? '補堂場次' : '覆課場次';
      alert(`請選擇${label}`);
      return;
    }
    if ((isReschedule || isMakeup || isRetake) && form.rescheduleSession) {
      const targetExists = rescheduleSessions.some((s) => String(s.session_id || s.id) === String(form.rescheduleSession));
      if (!targetExists) {
        setRescheduleSessionError('請從清單內選擇目標場次');
        alert('請從清單內選擇目標場次');
        return;
      }
    }
    setSaving(true);
    try {
      if (isCancel) {
        const res = await handleCancelRequestById(form.cancelRequestId);
        alert(res?.message || '申請已取消');
        if (onSubmitted) onSubmitted(res.request || form);
        handleClear();
        return;
      }
      const payload = {
        requestType: form.type,
        memberId: form.memberId,
        eventId: form.courseId || null,
        sessionId: form.session || null,
        targetSessionId: form.rescheduleSession || null,
        reason: form.reason || '',
      };
      const res = await handleSubmitRequest(payload);
      alert(res?.message || '申請已送出');
      if (onSubmitted) onSubmitted(res.request || form);
      handleClear();
    } catch (err) {
      console.error('Submit request failed', err);
      alert(err?.message || '申請提交失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setForm({ ...baseForm, type: requestType || baseForm.type });
    setMemberInput('');
    setMemberError(null);
    setEvents([]);
    setEventInput('');
    setEventError(null);
    setSessions([]);
    setSessionInput('');
    setSessionError(null);
    resetRescheduleSelection({ clearOptions: true });
    setCancelInput('');
    setCancelError(null);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, maxWidth: 720 }}>
      <h2 style={{ margin: '0 0 12px' }}>{form.type}</h2>

      <div style={{ marginBottom: 10 }}>
        <label>會員</label>
        <br />
        {isMemberUser ? (
          <input
            value={memberInput || form.memberId}
            readOnly
            disabled
            style={{ width: '100%', padding: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280' }}
          />
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
      {!isCancel && (
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
          {!eventError && form.memberId && !eventsLoading && events.length === 0 && (
            <div style={{ color: 'red', marginTop: 4 }}>此會員沒有已確認的活動。</div>
          )}
        </div>
      )}

      {isCancel && (
        <div style={{ marginBottom: 10 }}>
          <label>選擇欲取消的申請</label>
          <br />
          <input
            list="cancel-request-list"
            value={cancelInput}
            onChange={(e) => handleCancelRequestInput(e.target.value)}
            placeholder="選擇可取消的申請"
            style={{ width: '40%', padding: 8, borderColor: cancelError ? 'red' : '#e5e7eb' }}
            disabled={cancelOptions.length === 0}
          />
          <datalist id="cancel-request-list">
            {cancelOptions.map((opt) => (
              <option key={opt.id} value={opt.label} />
            ))}
          </datalist>
          {cancelError && <div style={{ color: 'red', marginTop: 4 }}>{cancelError}</div>}
          {!cancelError && cancelOptions.length === 0 && (
            <div style={{ color: '#6b7280', marginTop: 4 }}>目前沒有可取消的申請。</div>
          )}
        </div>
      )}

      {(isLeave || isReschedule) && (
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
          {!sessionError && form.memberId && form.courseId && !sessionsLoading && sessions.length === 0 && (
            <div style={{ color: 'red', marginTop: 4 }}>此會員暫無已報名場次。</div>
          )}
        </div>
      )}

      {(isReschedule || isMakeup || isRetake) && (
        <div style={{ marginBottom: 10 }}>
          <label>
            {isReschedule && '改期場次'}
            {!isReschedule && isMakeup && '補堂場次'}
            {!isReschedule && !isMakeup && isRetake && '覆課場次'}
          </label>
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
            placeholder={
              isReschedule
                ? '選擇欲改期的場次'
                : isMakeup
                ? '選擇補堂的場次'
                : '選擇覆課的場次'
            }
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
            <div style={{ color: 'red', marginTop: 4 }}>此活動目前沒有可供選擇的場次。</div>
          )}
          {!rescheduleSessionError && !form.courseId && (
            <div style={{ color: '#6b7280', marginTop: 4 }}>請先於上方選擇活動以載入場次。</div>
          )}
        </div>
      )}

        <div style={{ marginBottom: 10 }}>
          <label>備註</label>
          <br />
          <textarea
            value={form.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            placeholder={'請輸入原因'}
            rows={4}
            style={{ width: '60%', padding: 8, border: '1px solid #e5e7eb', resize: 'vertical' }}
          />
        </div>

      <div style={{ marginTop: 12 }}>
        <button type='submit' disabled={saving} style={{ marginRight: 8 }}>{saving ? '提交中…' : '提交'}</button>
        <button type='button' onClick={handleClear}>清空</button>
      </div>
    </form>
  );
};

export default RequestForm;
