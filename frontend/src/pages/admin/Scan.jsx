import React, { useEffect, useRef, useState, useCallback } from 'react';
import { handleListEvents } from '../../api/eventListAPI';
import { handleListSessionsByEventId } from '../../api/sessionAPI';
import { handleScanAttendance } from '../../api/attendanceAPI';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';



const Scan = () => {
  const navigate = useNavigate();
  const qrRef = useRef(null);          
  const hasStartedRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSessionTerm, setSearchSessionTerm] = useState('');

 
  const handleScanSuccess = useCallback(async (decodedText) => {
    console.log('Scanned:', decodedText);

    if (!selectedEventId) {
      alert('請先選擇簽到活動');
      return;
    }
    if (!selectedSessionId) {
      alert('請先選擇簽到場次');
      return;
    }

    const selectedEvent = events.find(ev => String(ev.event_id) === String(selectedEventId));
    const selectedSession = sessions.find(s => String(s.session_id) === String(selectedSessionId));
    if (!selectedSession) {
      alert('找不到對應的簽到場次，請重新選擇');
      return;
    }

    // 呼叫後端：用 qr_token + session_id 完成「找用戶 → 檢查報名 → 新增出席紀錄」
    let payload;
    try {
      payload = await handleScanAttendance({
        qr_token: decodedText,
        session_id: selectedSession.session_id,
      });
    } catch (err) {
      alert(err.message || '簽到失敗，請稍後再試');
      return;
    }

  // 後端成功寫入簽到後，才記錄最後一次掃描結果（僅用於畫面顯示）
  setLastResult(decodedText);

    const user = payload?.user;
    const eventLine = selectedEvent
      ? `${selectedEvent.type} ${selectedEvent.event_id} ${selectedEvent.event_name}`
      : `活動 ID: ${selectedEventId}`;
    const sessionTime = selectedSession.datetime_start
      ? `（${formatDateTimeForDisplay(selectedSession.datetime_start)}）`
      : '';
    const sessionLine = `${selectedSession.session_name || ''}${sessionTime}`;

    const userName = user?.name || '未知用戶';
    const userId = user?.user_id ? `（${user.user_id}）` : '';

    alert(`簽到成功！\n${eventLine}\n${sessionLine}\n用戶: ${userName}${userId}\nQR Token: ${decodedText}`);
  }, [selectedEventId, selectedSessionId, events, sessions]);


  const handleScanFailure = useCallback((err) => {
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const payload = await handleListEvents();
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

  const startScanning = async () => {
    if (scanning || hasStartedRef.current) return;
    setErrorMsg(null);
    if (!selectedEventId) {
      setErrorMsg('請先選擇要簽到的活動');
      return;
    }
    try {
      if (!qrRef.current) {
        qrRef.current = new Html5Qrcode('reader');
      }
      hasStartedRef.current = true;
      await qrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        handleScanSuccess,
        handleScanFailure
      );
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setErrorMsg(err.message || '啟動掃描失敗');
      hasStartedRef.current = false;
    }
  };

  const stopScanning = async () => {
    setErrorMsg(null);
    if (!qrRef.current) return;
    try {
      if (scanning) {
        await qrRef.current.stop();
      }
      await qrRef.current.clear();
      qrRef.current = null;
      hasStartedRef.current = false;
      setScanning(false);
    } catch (err) {
      console.warn('Stop/clear warning:', err);
      qrRef.current = null;
      hasStartedRef.current = false;
      setScanning(false);
    }
  };

  // redirect to quick register page
  const handleQuickRegister = async () => {
    try {
      await stopScanning();
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

    navigate('/customers/create', { state: { from: 'scan', sourceEvent, sourceSession } });
  };

  useEffect(() => {
    return () => {
      if (qrRef?.current?.stop) {
        Promise.resolve(qrRef.current.stop())
          .catch(err => console.error('Stop failed:', err))
          .finally(() => {
            if (qrRef?.current?.clear) {
              Promise.resolve(qrRef.current.clear())
                .catch(err => console.error('Clear failed:', err));
            }
            qrRef.current = null;
          });
      }
    };
  }, []);
  const selectedEventForCheckin = events.find(e => String(e.event_id) === String(selectedEventId));
  
  return (
    <div style={{ padding: 20 }}>
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

              // 若正在掃描中，切換活動後也重新啟動掃描，
              // 確保之後簽到都以新的活動／場次設定為準
              if (scanning) {
                try {
                  await stopScanning();
                  await startScanning();
                } catch (err) {
                  console.error('切換活動時重啟掃描失敗:', err);
                }
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

              // 若正在掃描中，為了讓新的場次設定生效，重啟掃描
              if (scanning) {
                try {
                  await stopScanning();
                  await startScanning();
                } catch (err) {
                  console.error('切換場次時重啟掃描失敗:', err);
                }
              }
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

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={startScanning} disabled={scanning || !selectedEventId}>
          {scanning ? 'Scanning...' : 'Start Scanning'}
        </button>
        <button type="button" onClick={stopScanning} disabled={!scanning}>
          Stop Scanning
        </button>
        {selectedEventForCheckin?.type === 'SEMINAR' && (
          <button
            type="button"
            onClick={handleQuickRegister}
            style={{ marginLeft: 8 }}
          >
            現場快速登記
          </button>
        )}
      </div>

      <div id="reader" style={{ width: 320, minHeight: 240, background: '#00000008', border: '1px solid #ccc' }} />

      <div style={{ marginTop: 16 }}>
        {selectedEventId && (
          <div style={{ marginBottom: 8, color: '#555' }}>
            目前簽到活動場次：<br />
            <strong>
              {(() => {
                const ev = events.find(e => String(e.event_id) === String(selectedEventId));
                const eventLine = ev ? `${ev.type || ''} ${ev.event_id} ${ev.event_name || ''}` : selectedEventId;
                
                if (selectedSessionId) {
                  const session = sessions.find(s => String(s.session_id) === String(selectedSessionId));
                  if (session) {
                    const sessionTime = session.datetime_start ? ` (${formatDateTimeForDisplay(session.datetime_start)})` : '';
                    return `${eventLine}\n${session.session_name || ''}${sessionTime}`;
                  }
                }
                return eventLine;
              })()}
            </strong>
          </div>
        )}
        <strong>Last Result:</strong> {lastResult ? <span style={{ color: 'green' }}>{lastResult}</span> : '---'}
      </div>
      {errorMsg && <div style={{ color: 'red', marginTop: 8 }}>{errorMsg}</div>}
    </div>
  );
};

export default Scan;