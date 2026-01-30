import React, { useState, useEffect, useRef, useCallback } from 'react';
import CustomersTable from '../../components/CustomersTable';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListConfirmedUsersByEvent } from '../../api/enrollmentAPI';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleGetSessionById, handleListSessionAttendees, handleDeleteSessionRegistration, handleCheckinRegistration, handleCancelCheckinRegistration, handleGetRegistrationAttendance } from '../../api/sessionAPI';
import { formatDateTimeForDisplay, formatTimeForDisplay, formatTimeForDisplayInHK } from '../../utils/dateFormatter';
import { handleUploadCertificate } from '../../api/certificatesAPI';
import { handleUploadReceipt } from '../../api/receiptsAPI';
import Scanner from '../../components/Scanner';

const statusTranslations = {
  PENDING: '待付款',
  CONFIRMED: '已確認',
};

const translateStatus = (status) => {
  if (!status) return '未提供';
  const key = String(status).trim().toUpperCase();
  return statusTranslations[key] || status;
};

const EnrolledList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  

  const authRole = (user && user.role) ? user.role.toUpperCase() : 'MEMBER';

  // 支援從路由參數或 query string 取得 event_id / session_id
  const searchParams = new URLSearchParams(location.search);
  const eventIdFromQuery = searchParams.get('event_id');
  const sessionIdFromQuery = searchParams.get('session_id');
  const eventIdFromPath = params.id || params.eventId || null;
  const sessionIdFromPath = params.sessionId || null;

  const sessionId = sessionIdFromPath || sessionIdFromQuery || null;
  const eventId = eventIdFromPath || eventIdFromQuery || null;

  const isSessionMode = Boolean(sessionId);

  const [members, setMembers] = useState([]);
  // local sign-in state stored per session in localStorage: { [sessionId]: { [registration_id]: true } }
  const [localSignIns, setLocalSignIns] = useState(() => {
    try {
      const raw = window.localStorage.getItem('localSignIns') || '{}';
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  });
  const [eventInfo, setEventInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const quickAlertShownRef = useRef(false);
  // pendingAttendance caches attendance objects (from scanner response) keyed by registration_id
  const [pendingAttendance, setPendingAttendance] = useState({});
  const RECENT_PENDING_MS = 60000; // consider pending cache valid for 60s
  // QR scanner state is encapsulated in the Scanner component

  // 轉到快速登記頁面（停止掃描後導向建立用戶，並帶入來源活動/場次）
  const handleQuickRegister = async () => {
    try {
      await stopAllGlobalInstances();
    } catch (_) {}

    const sourceEvent = eventInfo
      ? {
          event_id: eventInfo.event_id,
          event_name: eventInfo.event_name,
          datetime_start: eventInfo.datetime_start,
          type: eventInfo.type,
        }
      : null;
    const sourceSession = sessionInfo
      ? {
          session_id: sessionInfo.session_id,
          session_name: sessionInfo.session_name,
          datetime_start: sessionInfo.datetime_start,
        }
      : null;

    const returnPath = `${location.pathname}${location.search || ''}`;
    navigate('/customers/create', {
      state: {
        from: 'enrolledList',
        sourceEvent,
        sourceSession,
        returnPath,
      }
    });
  };
  // Global registry to avoid multiple Html5Qrcode instances on same container
  const ensureGlobalRegistry = () => {
    if (!window.__html5qrcode_instances) window.__html5qrcode_instances = {};
    return window.__html5qrcode_instances;
  };
  const setGlobalInstance = (containerId, inst) => {
    const reg = ensureGlobalRegistry();
    reg[containerId] = inst;
  };
  const getGlobalInstance = (containerId) => {
    const reg = ensureGlobalRegistry();
    return reg[containerId];
  };
  const clearGlobalInstance = (containerId) => {
    const reg = ensureGlobalRegistry();
    delete reg[containerId];
  };
  const stopAllGlobalInstances = async () => {
    const reg = ensureGlobalRegistry();
    const ids = Object.keys(reg || {});
    await Promise.all(ids.map(async (id) => {
      const inst = reg[id];
      try {
        try {
          const stopRes = inst.stop();
          if (stopRes && typeof stopRes.then === 'function') await stopRes.catch(() => {});
        } catch (_) {}
        try {
          const clearRes = inst.clear();
          if (clearRes && typeof clearRes.then === 'function') await clearRes.catch(() => {});
        } catch (_) {}
      } catch (e) {
        // ignore
      }
      try {
        const container = document.getElementById(id);
        if (container) while (container.firstChild) container.removeChild(container.firstChild);
      } catch (e) {}
      delete reg[id];
    }));
  };
  // Helper utilities used by Scanner are encapsulated in the Scanner component
  // 載入活動 / 場次資訊（顯示標題用）
  useEffect(() => {
    // 若為場次模式，先抓場次再抓對應活動
    const fetchSessionAndEvent = async () => {
      if (!sessionId) return;
      try {
        const res = await handleGetSessionById(sessionId);
        const session = res.session || null;
        setSessionInfo(session);
        const eventIdToLoad = session?.event_id || eventId;
        if (eventIdToLoad) {
          try {
            const eventRes = await handleGetEventById(eventIdToLoad);
            setEventInfo(eventRes.event || null);
          } catch (err) {
            console.error('載入活動資料失敗:', err);
          }
        }
      } catch (err) {
        console.error('載入場次資料失敗:', err);
        setError(err.message || '載入場次資料失敗');
      }
    };

    const fetchEventOnly = async () => {
      if (!eventId) return;
      try {
        const res = await handleGetEventById(eventId);
        setEventInfo(res.event || null);
      } catch (err) {
        console.error('載入活動資料失敗:', err);
      }
    };

    if (sessionId) {
      fetchSessionAndEvent();
    } else {
      fetchEventOnly();
    }
  }, [sessionId, eventId]);

  // Scanner lifecycle and handlers are implemented inside the Scanner component

  // 載入已報名會員清單（活動或場次）
  const fetchMembers = async () => {
    const isSessionMode = Boolean(sessionId);
    if (isSessionMode && !sessionId) return;
    if (!isSessionMode && !eventId) return;

    setLoading(true);
    setError(null);
    try {
      let res;
      if (isSessionMode) {
        res = await handleListSessionAttendees(sessionId);
      } else {
        res = await handleListConfirmedUsersByEvent(eventId, { status: 'ALL' });
      }
      const customers = res.users || [];
      const mapped = customers.map((c) => {
        const regId = String(c.registration_id);
        const serverTime = c.attendance_time || c.attend_time || null;
        const cached = pendingAttendance[regId] || null;
        const now = Date.now();
        // Use RECENT_PENDING_MS (defined at top) as cache validity window
        let finalTime;
        let finalStatus;
        if (cached && (now - (cached.ts || 0) < RECENT_PENDING_MS)) {
          finalTime = cached.attend_time;
          finalStatus = cached.status || (c.attendance_status || c.attendanceStatus || '');
        } else {
          finalTime = serverTime || (cached ? cached.attend_time : null);
          finalStatus = (c.attendance_status || c.attendanceStatus) || (cached ? (cached.status || '') : '');
        }
        // if server has now recorded the attendance and it's not being shadowed by recent cached value, clear cache
        if (serverTime && (!cached || (now - (cached.ts || 0) >= RECENT_PENDING_MS))) {
          if (pendingAttendance[regId]) setPendingAttendance((prev) => {
            const next = { ...(prev || {}) };
            delete next[regId];
            return next;
          });
        }
        return {
          registration_id: c.registration_id,
          enrollment_id: c.enrollment_id,
          payment_id: c.payment_id,
          id: c.user_id,
          user_id: c.user_id,
          name: c.name,
          role: c.role || 'MEMBER',
          mobile: c.mobile || '',
          email: c.email || '',
          status: c.status || c.enrollment_status || '',
          attendance_status: finalStatus,
          attendance_time: finalTime,
          issued_certificate: c.issued_certificate,
          issued_receipt: c.issued_receipt,
        };
      });
      setMembers(mapped);
    } catch (err) {
      console.error('載入已報名會員清單失敗:', err);
      setError(err.message || '載入已報名會員清單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [eventId, sessionId]);

  // If we returned from quick registration, apply quick attendance to UI then clear navigation state
  useEffect(() => {
    (async () => {
      try {
        // Handle quick registration via navigation state
        const qs = location?.state || null;
        if (qs && qs.quickRegistered) {
          const att = qs.quickAttendance || null;
          const regId = qs.quickRegistrationId || (att && att.registration_id) || (att && att.registration && att.registration.registration_id);
          if (att && regId) {
            const attendTime = att.attend_time || att.attendance_time || null;
            const status = att.status || 'G';
            setPendingAttendance((prev) => ({ ...prev, [String(regId)]: { attend_time: attendTime, status, ts: Date.now() } }));
            setMembers((prev) => (prev || []).map((m) => (
              String(m.registration_id) === String(regId)
                ? { ...m, attendance_status: status || m.attendance_status, attendance_time: attendTime || m.attendance_time }
                : m
            )));
          }
          // refresh list first so UI is ready before alert
          await fetchMembers();
          if (!quickAlertShownRef.current) {
            alert('現場快速登記完成\n已自動報名並完成簽到。');
            quickAlertShownRef.current = true;
          }
          // clear navigation state to avoid repeated handling
          try { navigate(location.pathname + (location.search || ''), { replace: true, state: {} }); } catch (e) { /* ignore */ }
        }

        // If we returned from Scan page with a recent scan, apply it from sessionStorage
        try {
          const raw = window.sessionStorage.getItem('scanReturnAttendance');
          if (raw) {
            const parsed = JSON.parse(raw);
            const regId = parsed && parsed.registrationId;
            const att = parsed && parsed.attendance;
            if (regId && att) {
              const attendTime = att.attend_time || att.attendance_time || null;
              const status = att.status || att.status || null;
              setPendingAttendance((prev) => ({ ...prev, [String(regId)]: { attend_time: attendTime, status, ts: Date.now() } }));
              setMembers((prev) => (prev || []).map((m) => (
                String(m.registration_id) === String(regId)
                  ? { ...m, attendance_status: status || m.attendance_status, attendance_time: attendTime || m.attendance_time }
                  : m
              )));
              // clear marker to avoid re-applying
              try { window.sessionStorage.removeItem('scanReturnAttendance'); } catch (e) {}
              // also refresh list to ensure server state is authoritative
              await fetchMembers();
            }
          }
        } catch (e) {
          console.warn('Failed to apply scanReturnAttendance', e);
        }
      } catch (e) {
        console.warn('Quick registration state handling failed', e);
      }
    })();
  }, [location?.state]);

  const handleView = (user_id) => {
    navigate(`/customers/${user_id}`);
  };

  const handleRefund = (payment_id) => {
    if (!payment_id) {
      alert('找不到付款紀錄，無法退款');
      return;
    }
    navigate(`/payments/${payment_id}/process`);
  };

  const handleDeleteRegistration = async (registration_id) => {
    if (!registration_id) {
      alert('找不到報名紀錄，無法刪除');
      return;
    }
    if (!window.confirm('確認要刪除此場次報名嗎？')) return;
    try {
      await handleDeleteSessionRegistration(registration_id);
      // refresh list
      setMembers((prev) => prev.filter((m) => String(m.registration_id) !== String(registration_id)));
      alert('場次報名已刪除');
    } catch (err) {
      alert(err?.message || '刪除失敗，請稍後再試');
    }
  };

  // server-side check-in/cancel helpers (only for permitted staff roles)
  const handleServerCheckin = async (registration_id, options = {}) => {
    try {
      const res = await handleCheckinRegistration(registration_id, options);
      const att = res?.attendance || null;
      if (att) {
        const attendTime = att.attend_time || att.attendance_time || null;
        const status = att.status || null;
        // cache and apply immediately so UI shows the returned attendance time (manual should show session time)
        setPendingAttendance((prev) => ({ ...prev, [String(registration_id)]: { attend_time: attendTime, status, ts: Date.now() } }));
        setMembers((prev) => (prev || []).map((m) => (
          String(m.registration_id) === String(registration_id)
            ? { ...m, attendance_status: status || m.attendance_status, attendance_time: attendTime || m.attendance_time }
            : m
        )));
      }
      // give DB a moment then refresh to ensure list is authoritative
      await new Promise((r) => setTimeout(r, 300));
      await fetchMembers();
    } catch (err) {
      console.error('簽到失敗', err);
      // If server responded with an attendance payload (e.g., 422 for out-of-window manual checkin), reflect that in UI immediately
      const payload = err?.payload || (err?.response && err.response.data) || null;
      try {
        if (payload) {
          const att = payload.attendance || null;
          const attemptStatus = payload.attemptStatus || (att && att.status) || null;
          if (att) {
            const attendTime = att.attend_time || att.attendance_time || null;
            const status = attemptStatus || att.status || null;
            setPendingAttendance((prev) => ({ ...prev, [String(registration_id)]: { attend_time: attendTime, status, ts: Date.now() } }));
            setMembers((prev) => (prev || []).map((m) => (
              String(m.registration_id) === String(registration_id)
                ? { ...m, attendance_status: status || m.attendance_status, attendance_time: attendTime || m.attendance_time }
                : m
            )));
          }
        }
      } catch (e) {
        console.warn('Failed to apply server returned attendance on error', e);
      }
    }
  };

  const handleServerCancelCheckin = async (registration_id) => {
    try {
      await handleCancelCheckinRegistration(registration_id);
      // give DB a moment then refresh
      await new Promise((r) => setTimeout(r, 300));
      await fetchMembers();
      // clear any pending cache
      setPendingAttendance((prev) => {
        const next = { ...(prev || {}) };
        delete next[String(registration_id)];
        return next;
      });
    } catch (err) {
      console.error('取消簽到失敗', err);
      // If server reports no attendance (404) we should clear local pending attendance so UI reflects cancellation
      const message = err?.message || '';
      if (err?.status === 404 || message.includes('未有出席紀錄')) {
        setPendingAttendance((prev) => {
          const next = { ...(prev || {}) };
          delete next[String(registration_id)];
          return next;
        });
        // also update members immediately to remove attendance_time/status
        setMembers((prev) => (prev || []).map((m) => (
          String(m.registration_id) === String(registration_id)
            ? { ...m, attendance_status: '', attendance_time: null }
            : m
        )));
      }
    }
  };

  // frontend-only: toggle local sign-in for a registration
  const toggleLocalSignIn = (registration_id) => {
    if (!sessionId) return; // only meaningful in session mode
    setLocalSignIns((prev) => {
      const next = { ...(prev || {}) };
      const sessionKey = String(sessionId);
      if (!next[sessionKey]) next[sessionKey] = {};
      const rid = String(registration_id);
      // toggle
      next[sessionKey] = { ...(next[sessionKey] || {}) };
      next[sessionKey][rid] = !next[sessionKey][rid];
      try {
        window.localStorage.setItem('localSignIns', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist local sign-ins', e);
      }
      return next;
    });
  };

  

  const handleCertificateUpload = (customer) => {
    if (!eventId) {
      alert('缺少活動ID，無法上傳證書');
      return;
    }
    if (!customer?.user_id) {
      alert('缺少使用者ID，無法上傳證書');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await handleUploadCertificate({
          eventId,
          userId: customer.user_id,
          paymentId: customer.payment_id,
          file
        });
        setMembers((prev) => prev.map((m) => (
          String(m.user_id) === String(customer.user_id)
            ? { ...m, issued_certificate: true }
            : m
        )));
        alert('證書已上傳');
      } catch (err) {
        alert(err?.message || '上傳證書失敗');
      }
    };
    input.click();
  };

  const handleReceiptUpload = (customer) => {
    if (!eventId) {
      alert('缺少活動ID，無法上傳收據');
      return;
    }
    if (!customer?.user_id) {
      alert('缺少使用者ID，無法上傳收據');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await handleUploadReceipt({
          eventId,
          userId: customer.user_id,
          paymentId: customer.payment_id,
          file
        });
        setMembers((prev) => prev.map((m) => (
          String(m.user_id) === String(customer.user_id)
            ? { ...m, issued_receipt: true }
            : m
        )));
        alert('收據已上傳');
      } catch (err) {
        alert(err?.message || '上傳收據失敗');
      }
    };
    input.click();
  };

  const handleDownloadCSV = () => {
    if (!members || members.length === 0) {
      alert('沒有會員可下載');
      return;
    }

    const eventName = eventInfo?.event_name || '未知活動';
    const sessionName = sessionInfo?.session_name || '';
    const sessionDate = sessionInfo?.datetime_start
      ? new Date(sessionInfo.datetime_start).toLocaleDateString('zh-HK', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
      : '';

    const csv = [
      ['點名表', eventName, sessionName, sessionDate].join(','),
      ['編號', '姓名', '電話', '簽名', '標記'].join(','),
      ...members.map((m) => [
        m.user_id,
        m.name,
        m.mobile || '',
        '',
        ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileName = `點名表_${eventName}${sessionName ? '_' + sessionName : ''}${sessionDate ? '_' + sessionDate : ''}.csv`;
    link.download = fileName;
    link.click();
  };

  const handlePrint = () => {
    setShowPreview(true);
  };

  if (!eventId && !sessionId) {
    return (
      <div style={{ padding: 20 }}>
        <h1>已報名會員清單</h1>
        <p>缺少活動或場次 ID，無法載入已報名名單。</p>
      </div>
    );
  }


  return (
    <div style={{ padding: 20 }}>
      <style>{`#reader-enrolled video, #reader-enrolled canvas { width: 100% !important; height: 100% !important; object-fit: cover; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <h1>{isSessionMode ? '場次已報名會員清單' : '活動已報名會員清單'}</h1>
          {eventInfo && (
            <div>
              <p>
                活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}
              </p>
              {isSessionMode && sessionInfo && (
                <p>
                  場次 ID: {sessionInfo.session_id} ｜ 場次名稱: {sessionInfo.session_name || 'N/A'} ｜ 時間: {sessionInfo.datetime_start ? formatDateTimeForDisplay(sessionInfo.datetime_start) : 'N/A'}
                </p>
              )}
              
            </div>
          )}
        </div>

        {isSessionMode && (
          <Scanner
            sessionId={sessionId}
            sessionInfo={sessionInfo}
            eventInfo={eventInfo}
            onQuickRegister={handleQuickRegister}
            onMarkLocalSignIn={async (sessionKey, registrationId, attendance = null) => {
              try {
                setLocalSignIns((prev) => {
                  const next = { ...(prev || {}) };
                  if (!next[sessionKey]) next[sessionKey] = {};
                  next[sessionKey] = { ...(next[sessionKey] || {}) };
                  next[sessionKey][String(registrationId)] = true;
                  try { window.localStorage.setItem('localSignIns', JSON.stringify(next)); } catch (e) { /* ignore */ }
                  return next;
                });

                // If backend returned attendance info, cache it and update the specific member immediately to show scan time
                if (attendance) {
                  const attendTime = attendance.attend_time || attendance.attendance_time || attendance.attendTime || null;
                  const status = attendance.status || null;
                  // cache pending attendance to avoid fetchMembers overwriting with empty data
                  setPendingAttendance((prev) => ({ ...prev, [String(registrationId)]: { attend_time: attendTime, status, ts: Date.now() } }));
                  setMembers((prev) => (prev || []).map((m) => (
                    String(m.registration_id) === String(registrationId)
                      ? { ...m, attendance_status: status || m.attendance_status, attendance_time: attendTime || m.attendance_time }
                      : m
                  )));
                }

                // Start polling for authoritative attendance record (up to ~3s)
                (async function pollServerForAttendance(regId) {
                  try {
                    const attempts = 6;
                    const interval = 500;
                    for (let i = 0; i < attempts; i++) {
                      try {
                        // Call focused endpoint to get latest attendance for this registration
                        const attendance = await handleGetRegistrationAttendance(regId).catch(() => null);
                        const serverTime = attendance && (attendance.attend_time || attendance.attendance_time) ? (attendance.attend_time || attendance.attendance_time) : null;
                        const status = attendance && attendance.status ? attendance.status : null;
                        if (serverTime) {
                          // update member with server time and clear pending cache
                          setMembers((prev) => (prev || []).map((m) => (
                            String(m.registration_id) === String(regId)
                              ? { ...m, attendance_status: status || m.attendance_status, attendance_time: serverTime }
                              : m
                          )));
                          setPendingAttendance((prev) => {
                            const next = { ...(prev || {}) };
                            delete next[String(regId)];
                            return next;
                          });
                          break;
                        }
                      } catch (e) {
                        // ignore transient errors
                      }
                      await new Promise((r) => setTimeout(r, interval));
                    }
                  } catch (e) {
                    console.warn('Polling attendance failed', e);
                  }
                })(registrationId);
              } catch (e) {
                console.warn('Failed to mark local sign-in from Scanner:', e);
              }
            }}
          />
        )}
      </div>

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && !showPreview && (
        <>
          {members.length === 0 ? (
            <p>目前沒有報名紀錄。</p>
          ) : (
            <CustomersTable
              customers={members}
              role={authRole}
              onView={handleView}
              onEdit={null}
              onDelete={null}
              showAdminActions={false}
              extraColumns={[
                ...(!isSessionMode
                  ? [
                      {
                        header: '報名狀態',
                        render: (customer) => translateStatus(customer.status)
                      }
                    ]
                  : []),
                // Add sign-in column only in session mode
                ...(isSessionMode ? [
                  {
                    header: '簽到',
                    render: (customer) => {
                      const status = customer.attendance_status || customer.attendanceStatus;
                      const regId = String(customer.registration_id);
                      const cached = pendingAttendance[regId] || null;
                      const now = Date.now();
                      const displayTime = (cached && (now - (cached.ts || 0) < RECENT_PENDING_MS) && cached.attend_time)
                        || customer.attendance_time || null;
                      const timeStr = displayTime ? ` ${formatTimeForDisplayInHK(displayTime)}` : '';
                      if (typeof status === 'string' && status.trim()) {
                        const normalized = status.trim().toUpperCase();
                        if (normalized === 'G' || normalized === 'Y') return `出席${timeStr}`;
                        if (normalized === 'R') return `遲到/無效${timeStr}`;
                        return `${normalized}${timeStr}`;
                      }
                      return '未簽到';
                    }
                  }
                ] : []),
                ...(!isSessionMode
                  ? [
                      {
                        header: '證書',
                        render: (customer) => (customer.issued_certificate ? '已發放' : '未發放')
                      },
                      {
                        header: '收據',
                        render: (customer) => (customer.issued_receipt ? '已發放' : '未發放')
                      }
                    ]
                  : [])
              ]}
              renderActions={(customer) => {
                if (isSessionMode) {
                  const serverRoles = ['ADMIN','SALES','LEADER'];
                  const canServerCheckin = serverRoles.includes(String(authRole || '').toUpperCase());
                  const status = customer.attendance_status || customer.attendanceStatus || '';
                  const signed = typeof status === 'string' && (status.trim().toUpperCase() === 'G' || status.trim().toUpperCase() === 'Y');
                  return (
                      <>
                        <button
                          style={{ marginRight: 8, position: 'relative', zIndex: 2000 }}
                          onClick={async () => {
                            if (canServerCheckin) {
                              if (signed) {
                                await handleServerCancelCheckin(customer.registration_id);
                              } else {
                                // manual button press -> use session time
                                await handleServerCheckin(customer.registration_id, { manual: true });
                              }
                            } else {
                              // fallback to local-only sign-in for non-staff
                              toggleLocalSignIn(customer.registration_id);
                            }
                          }}
                        >
                          {canServerCheckin ? (signed ? '取消簽到' : '簽到') : (() => {
                            const sessionKey = String(sessionId);
                            const rid = String(customer.registration_id);
                            const signedLocal = !!(localSignIns && localSignIns[sessionKey] && localSignIns[sessionKey][rid]);
                            return signedLocal ? '取消簽到' : '簽到';
                          })()}
                        </button>
                        <button
                          style={{ color: 'red', position: 'relative', zIndex: 2000 }}
                          onClick={() => handleDeleteRegistration(customer.registration_id)}
                        >
                          刪除報名
                        </button>
                      </>
                  );
                }
                return (
                  <>
                    <button
                      style={{ color: 'red' }}
                      onClick={() => {
                        if (!customer.payment_id) {
                          alert('找不到付款紀錄，無法退款');
                          return;
                        }
                        handleRefund(customer.payment_id);
                      }}
                    >
                      退款
                    </button>
                    <button
                      style={{ marginLeft: 8 }}
                      onClick={() => handleCertificateUpload(customer)}
                    >
                      上傳證書
                    </button>
                    <button
                      style={{ marginLeft: 8 }}
                      onClick={() => handleReceiptUpload(customer)}
                    >
                      上傳收據
                    </button>
                  </>
                );
              }}
            />
          )}

          <div style={{ marginTop: 16 }}>
            <button onClick={async () => { try { await stopAllGlobalInstances(); } catch (e) { /* ignore */ } navigate(-1); }} style={{ marginRight: 8 }}>返回上一頁</button>
            {isSessionMode && members.length > 0 && (
              <>
                <button 
                  onClick={handleDownloadCSV}
                  style={{ marginRight: 8 }}
                >
                  下載 CSV
                </button>
                <button 
                  onClick={handlePrint}
                >
                  列印預覽
                </button>
              </>
            )}
          </div>
        </>
      )}

      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 8,
            width: '90%',
            height: '90%',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <style>{`
              @media print {
                body { margin: 0; padding: 0; }
                .print-container { padding: 0 !important; }
                .print-buttons { display: none !important; }
                .print-title { page-break-after: avoid; }
                .print-table { border: none !important; }
                .print-table th, .print-table td { 
                  border: none !important; 
                  background-color: transparent !important;
                  padding: 8px 12px !important;
                  text-align: left !important;
                }
              }
            `}</style>
            <h2 className="print-title" style={{ marginTop: 0, marginBottom: 20 }}>點名表</h2>
            <table className="print-table" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 20, fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ padding: 12, textAlign: 'left', borderRight: '1px solid #ccc' }}>編號</th>
                  <th style={{ padding: 12, textAlign: 'left', borderRight: '1px solid #ccc' }}>姓名</th>
                  <th style={{ padding: 12, textAlign: 'left', borderRight: '1px solid #ccc' }}>電話</th>
                  <th style={{ padding: 12, textAlign: 'left', borderRight: '1px solid #ccc' }}>簽名</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>標記</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: 12, borderRight: '1px solid #ccc' }}>{m.user_id}</td>
                    <td style={{ padding: 12, borderRight: '1px solid #ccc' }}>{m.name}</td>
                    <td style={{ padding: 12, borderRight: '1px solid #ccc' }}>{m.mobile || ''}</td>
                    <td style={{ padding: 12, borderRight: '1px solid #ccc', height: 40 }}></td>
                    <td style={{ padding: 12 }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 'auto' }} className="print-buttons">
              <button
                onClick={() => window.print()}
                style={{ marginRight: 8 }}
              >
                打印
              </button>
              <button
                onClick={() => setShowPreview(false)}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrolledList;
