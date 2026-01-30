import React, { useEffect, useRef, useState, useCallback } from 'react';
import { handleListEvents } from '../../api/eventListAPI';
import { handleListSessionsByEventId, handleGetRegistrationAttendance } from '../../api/sessionAPI';
import { handleScanAttendance } from '../../api/attendanceAPI';
import { useNavigate, useLocation } from 'react-router-dom';
import Scanner from '../../components/Scanner';
import { formatDateTimeForDisplay, formatDateTimeWithSecondsForDisplay } from '../../utils/dateFormatter';


const Scan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingSessionRestoreRef = useRef(null);
  const hasRestoredSelectionsRef = useRef(false);
  const quickAlertShownRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSessionTerm, setSearchSessionTerm] = useState('');

  useEffect(() => {
    if (hasRestoredSelectionsRef.current) return;
    try {
      const cached = window.sessionStorage.getItem('scanReturnState');
      if (!cached) return;
      const parsed = JSON.parse(cached);
      if (parsed.selectedEventId) {
        setSelectedEventId(String(parsed.selectedEventId));
        if (typeof parsed.searchTerm === 'string') {
          setSearchTerm(parsed.searchTerm);
        }
      }
      if (parsed.selectedSessionId) {
        pendingSessionRestoreRef.current = String(parsed.selectedSessionId);
      }
      if (typeof parsed.searchSessionTerm === 'string') {
        setSearchSessionTerm(parsed.searchSessionTerm);
      }
      hasRestoredSelectionsRef.current = true;
    } catch (err) {
      console.warn('Failed to restore scan selections', err);
    } finally {
      try {
        window.sessionStorage.removeItem('scanReturnState');
      } catch (_) {}
    }
  }, []);

  // Show quick-register result when returning from CustomerCreate
  useEffect(() => {
    let handled = false;
    try {
      const raw = window.sessionStorage.getItem('scanQuickRegisterResult');
      if (raw) {
        const result = JSON.parse(raw);
        if (!quickAlertShownRef.current) {
          if (result?.success) {
            const namePart = result.userName ? `（${result.userName}${result.userId ? ` / ${result.userId}` : ''}）` : '';
            alert(`現場快速登記完成${namePart ? '：' + namePart : ''}\n已自動報名並完成簽到。`);
            quickAlertShownRef.current = true;
          } else if (result?.message) {
            alert(result.message);
            quickAlertShownRef.current = true;
          }
        }
        handled = true;
      }
    } catch (e) {
      // ignore parse errors
    } finally {
      try { window.sessionStorage.removeItem('scanQuickRegisterResult'); } catch (_) {}
    }

    const qs = location?.state;
    if (handled && qs && (qs.quickRegistered || qs.quickRegisterMessage)) {
      // clear state without re-alerting
      try { navigate(location.pathname + (location.search || ''), { replace: true, state: {} }); } catch (_) {}
      return;
    }

    if (!handled && qs) {
      try {
        if (!quickAlertShownRef.current) {
          if (qs.quickRegistered) {
            const namePart = qs.userName ? `（${qs.userName}${qs.userId ? ` / ${qs.userId}` : ''}）` : '';
            alert(`現場快速登記完成${namePart ? '：' + namePart : ''}\n已自動報名並完成簽到。`);
            quickAlertShownRef.current = true;
            handled = true;
          } else if (qs.quickRegisterMessage) {
            alert(qs.quickRegisterMessage);
            quickAlertShownRef.current = true;
            handled = true;
          }
        } else {
          handled = true;
        }
      } catch (e) {
        // ignore
      } finally {
        if (handled) {
          try { navigate(location.pathname + (location.search || ''), { replace: true, state: {} }); } catch (_) {}
        }
      }
    }
  }, [location, navigate]);


 
  // Scanner component handles the scan lifecycle and server interactions.
  // Page-level responses are handled via the Scanner callbacks (see onMarkLocalSignIn below).


  useEffect(() => {
    (async () => {
      try {
        const payload = await handleListEvents({ status: 'OPEN' });
        const eventsList = payload?.events || [];
        
        const now = new Date();
        const thirtyMinutesInMs = 30 * 60 * 1000;
        const filteredEvents = eventsList.filter((ev) => {
          if (!ev.datetime_end) return true;
          const eventEnd = new Date(ev.datetime_end);
          const timeSinceEnd = now - eventEnd;
          return timeSinceEnd < thirtyMinutesInMs; 
        });
        
        setEvents(filteredEvents);
      } catch (err) {
        console.error('載入活動清單失敗:', err);
      }
    })();
  }, []);

  // 當選擇了活動後，載入該活動的場次清單
  useEffect(() => {
    (async () => {
      if (!selectedEventId) {
        setSessions([]);
        setSelectedSessionId('');
        setSearchSessionTerm('');
        return;
      }
      try {
        const payload = await handleListSessionsByEventId(selectedEventId);
        const sessionsList = payload?.sessions || [];
        

        const now = new Date();
        const thirtyMinutesInMs = 30 * 60 * 1000;
        const filteredSessions = sessionsList.filter((s) => {
          if (!s.datetime_end) return true; 
          const sessionEnd = new Date(s.datetime_end);
          const timeSinceEnd = now - sessionEnd;
          return timeSinceEnd < thirtyMinutesInMs;
        });
        

        const sortedSessions = filteredSessions.slice().sort((a, b) => {
          const aTime = a.datetime_start ? new Date(a.datetime_start).getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.datetime_start ? new Date(b.datetime_start).getTime() : Number.POSITIVE_INFINITY;
          return aTime - bTime;
        });
        
        setSessions(sortedSessions);

        if (sortedSessions.length > 0) {
          const pendingSessionId = pendingSessionRestoreRef.current;
          if (pendingSessionId) {
            const restored = sortedSessions.find((s) => String(s.session_id) === String(pendingSessionId));
            if (restored) {
              setSelectedSessionId(restored.session_id);
              const timeStr = restored.datetime_start ? ` (${formatDateTimeForDisplay(restored.datetime_start)})` : '';
              setSearchSessionTerm(`${restored.session_name || ''}${timeStr}`);
              pendingSessionRestoreRef.current = null;
              return;
            }
            pendingSessionRestoreRef.current = null;
          }

          const closestSession = sortedSessions[0];
          setSelectedSessionId(closestSession.session_id);
          const timeStr = closestSession.datetime_start ? ` (${formatDateTimeForDisplay(closestSession.datetime_start)})` : '';
          setSearchSessionTerm(`${closestSession.session_name || ''}${timeStr}`);
        } else {
          setSelectedSessionId('');
          setSearchSessionTerm('');
        }
      } catch (err) {
        console.error('載入場次清單失敗:', err);
        setSessions([]);
        setSelectedSessionId('');
        setSearchSessionTerm('');
      }
    })();
  }, [selectedEventId]);



  // Small helper to stop any Html5Qrcode instances created by Scanner component(s)
  const ensureGlobalRegistry = () => {
    if (!window.__html5qrcode_instances) window.__html5qrcode_instances = {};
    return window.__html5qrcode_instances;
  };
  const stopAllGlobalInstances = async () => {
    const reg = ensureGlobalRegistry();
    const ids = Object.keys(reg || {});
    await Promise.all(ids.map(async (id) => {
      const inst = reg[id];
      try {
        try { const stopRes = inst.stop(); if (stopRes && typeof stopRes.then === 'function') await stopRes.catch(() => {}); } catch (_) {}
        try { const clearRes = inst.clear(); if (clearRes && typeof clearRes.then === 'function') await clearRes.catch(() => {}); } catch (_) {}
      } catch (e) {}
      try { const container = document.getElementById(id); if (container) while (container.firstChild) container.removeChild(container.firstChild); } catch (e) {}
      delete reg[id];
    }));
  };

  const [scannerKey, setScannerKey] = useState(0);

  // redirect to quick register page
  const handleQuickRegister = async () => {
    try {
      await stopAllGlobalInstances();
    } catch (_) {}

    const ev = events.find((e) => String(e.event_id) === String(selectedEventId));
    const session = sessions.find((s) => String(s.session_id) === String(selectedSessionId));
    const sourceEvent = ev
      ? {
          event_id: ev.event_id,
          event_name: ev.event_name,
          datetime_start: ev.datetime_start,
          type: ev.type,
        }
      : null;
    const sourceSession = session
      ? {
          session_id: session.session_id,
          session_name: session.session_name,
          datetime_start: session.datetime_start,
        }
      : null;

    try {
      window.sessionStorage.setItem(
        'scanReturnState',
        JSON.stringify({
          selectedEventId,
          selectedSessionId,
          searchTerm,
          searchSessionTerm,
        })
      );
    } catch (err) {
      console.warn('Failed to cache scan state before quick register', err);
    }

    const returnPath = `${location.pathname}${location.search || ''}`;
    navigate('/customers/create', {
      state: {
        from: 'scan',
        sourceEvent,
        sourceSession,
        returnPath,
      },
    });
  };

  useEffect(() => {
    return () => {
      try { stopAllGlobalInstances(); } catch (e) { /* ignore */ }
    };
  }, []);
  const selectedEventForCheckin = events.find(e => String(e.event_id) === String(selectedEventId));
  
  return (
    <div style={{ padding: 20 }}>
      <style>{`#reader-enrolled video, #reader-enrolled canvas { width: 100% !important; height: 100% !important; object-fit: cover; }`}</style>
      <h1>QR Code Scanner</h1>

      {/* Event select bar with type-to-search */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>
          選擇簽到活動：
        </label>
        <input
          list="events-list"
          value={searchTerm}
          onChange={async (e) => {
            setSearchTerm(e.target.value);
            const match = events.find(ev => 
              `${ev.event_id} - ${ev.event_name}` === e.target.value
            );
            if (match) {
              setSelectedEventId(match.event_id);
              // 清空場次選擇
              setSelectedSessionId('');
              setSearchSessionTerm('');

              // 若正在掃描中，切換活動後強制 remount Scanner，
              // 以確保新活動／場次設定生效並釋放相機資源
              try {
                await stopAllGlobalInstances();
                setScannerKey((k) => k + 1);
                setLastResult(null);
              } catch (err) {
                console.error('切換活動時重啟掃描失敗:', err);
              }
            } else {
              setSelectedEventId('');
              setSelectedSessionId('');
              setSearchSessionTerm('');
            }
          }}
          onFocus={(e) => {
            setSearchTerm('');
            setSelectedEventId('');
            setSelectedSessionId('');
            setSearchSessionTerm('');
          }}
          placeholder="輸入或選擇活動..."
          style={{ padding: 6, minWidth: 400 }}
        />
        <datalist id="events-list">
          {events.map((ev) => (
            <option key={ev.event_id} value={`${ev.event_id} - ${ev.event_name}`} />
          ))}
        </datalist>
      </div>

      {/* Session select bar (depends on selected event) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>選擇簽到場次：</label>
        <input
          list="sessions-list"
          value={searchSessionTerm}
          onChange={async (e) => {
            const val = e.target.value.trim();
            setSearchSessionTerm(val);
            // 從清單選擇場次（包含時間顯示）
            const match = sessions.find((s) => {
              const timeStr = s.datetime_start ? ` (${formatDateTimeForDisplay(s.datetime_start)})` : '';
              const optionStr = `${s.session_name || ''}${timeStr}`;
              return optionStr === val;
            });
            if (match) {
              setSelectedSessionId(match.session_id);
              const timeStr = match.datetime_start ? ` (${formatDateTimeForDisplay(match.datetime_start)})` : '';
              setSearchSessionTerm(`${match.session_name || ''}${timeStr}`);

              // If scanner is visible, remount it by relying on key change (Scanner handles its own lifecycle)
              // This ensures new session settings take effect immediately
              setLastResult(null);
            } else {
              setSelectedSessionId('');
            }
          }}
          onFocus={(e) => {
            setSearchSessionTerm('');
            setSelectedSessionId('');
          }}
          placeholder={selectedEventId ? '輸入或選擇場次...' : '請先選擇活動'}
          style={{ padding: 6, minWidth: 400 }}
          disabled={!selectedEventId}
        />
        <datalist id="sessions-list">
          {sessions.map((s) => {
            const timeStr = s.datetime_start ? ` (${formatDateTimeForDisplay(s.datetime_start)})` : '';
            return <option key={s.session_id} value={`${s.session_name || ''}${timeStr}`} />;
          })}
        </datalist>
      </div>

      <div style={{ marginBottom: 12 }}>
        {selectedSessionId ? (
          <Scanner
            key={`${selectedSessionId}_${scannerKey}`}
            sessionId={selectedSessionId}
            sessionInfo={sessions.find(s => String(s.session_id) === String(selectedSessionId))}
            eventInfo={events.find(e => String(e.event_id) === String(selectedEventId))}
            onQuickRegister={handleQuickRegister}
            scannerWidth={520}
            readerSize={240}
            onMarkLocalSignIn={async (sessionKey, registrationId, attendance = null) => {
              try {
                if (attendance) {
                  const attendTime = attendance.attend_time || attendance.attendance_time || null;
                  const status = attendance.status || null;
                  const statusNorm = status ? String(status).trim().toUpperCase() : null;
                  const statusLabel = statusNorm === 'G' || statusNorm === 'Y' ? '簽到成功' : (statusNorm === 'R' ? '簽到失敗(遲到/無效)' : (status || '簽到'));
                  const timeStr = attendTime ? ` ${formatDateTimeWithSecondsForDisplay(attendTime)}` : '';
                  setLastResult(`${statusLabel}${timeStr}`);

                  // Store a short-lived marker so when user returns to the enrolled list the scanned attendance is applied
                  try {
                    const marker = { registrationId, attendance };
                    try { window.sessionStorage.setItem('scanReturnAttendance', JSON.stringify(marker)); } catch (e) { /* ignore */ }
                  } catch (e) {}

                  // Poll server for authoritative attendance (up to ~3s), similar to EnrolledList
                  (async function pollServerForAttendance(regId) {
                    try {
                      const attempts = 6;
                      const interval = 500;
                      for (let i = 0; i < attempts; i++) {
                        const attendanceResp = await handleGetRegistrationAttendance(regId).catch(() => null);
                        const serverTime = attendanceResp && (attendanceResp.attend_time || attendanceResp.attendance_time) ? (attendanceResp.attend_time || attendanceResp.attendance_time) : null;
                        const serverStatus = attendanceResp && attendanceResp.status ? attendanceResp.status : null;
                        if (serverTime) {
                          const serverStatusNorm = serverStatus ? String(serverStatus).trim().toUpperCase() : null;
                          const serverLabel = serverStatusNorm === 'G' || serverStatusNorm === 'Y' ? '簽到成功' : (serverStatusNorm === 'R' ? '簽到失敗(遲到/無效)' : (serverStatus || '簽到'));
                          setLastResult(`${serverLabel} ${formatDateTimeWithSecondsForDisplay(serverTime)}`);
                          break;
                        }
                        await new Promise((r) => setTimeout(r, interval));
                      }
                    } catch (e) {
                      // ignore polling errors
                    }
                  })(registrationId);
                }
              } catch (e) { console.warn('Scanner callback failed', e); }
            }}
          />
        ) : (
          <div style={{ padding: 12, color: '#666' }}>請先選擇活動與場次以啟動掃描</div>
        )}
      </div>


      {errorMsg && <div style={{ color: 'red', marginTop: 8 }}>{errorMsg}</div>}
    </div>
  );
};

export default Scan;