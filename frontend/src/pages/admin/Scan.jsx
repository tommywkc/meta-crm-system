import React, { useEffect, useRef, useState, useCallback } from 'react';
import { handleListEvents } from '../../api/eventListAPI';
import { handleGetUserByQRToken } from '../../api/customersListAPI';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';



const Scan = () => {
  const navigate = useNavigate();
  const qrRef = useRef(null);          
  const hasStartedRef = useRef(false);
  const lastResultRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

 
  const handleScanSuccess = useCallback(async (decodedText) => {
    console.log('Scanned:', decodedText);

    // 先以 QR Token 從後端查詢用戶
    let customer = null;
    try {
      const payload = await handleGetUserByQRToken(decodedText);
      customer = payload?.customer || null;
    } catch (err) {
      console.error('Invalid QR token or fetch failed:', err);
      alert('無效的 QR Code，請確認後再試。');
      return;
    }

    // 重複掃描檢查
    if (decodedText === lastResultRef.current) {
      const userName = customer?.name || '未知用戶';
      const userId = customer?.user_id ? `（${customer.user_id}）` : '';
      alert(`此 QR Code 已成功簽到過！\n\n用戶: ${userName}${userId}\nQR Token: ${decodedText}`);
      return;
    }

    // 記錄最後一次掃描結果
    lastResultRef.current = decodedText;
    setLastResult(decodedText);

    // 顯示活動資訊 + 用戶名稱
    const selectedEvent = events.find(ev => String(ev.event_id) === String(selectedEventId));
    const eventInfo = selectedEvent 
      ? `${selectedEvent.type} ${selectedEvent.event_id} ${selectedEvent.event_name} (${selectedEvent.datetime_start || ''})`
      : `活動 ID: ${selectedEventId}`;

    const userName = customer?.name || '未知用戶';
    const userId = customer?.user_id ? `（${customer.user_id}）` : '';
    alert(`簽到成功！\n${eventInfo}\n用戶: ${userName}${userId}\nQR Token: ${decodedText}`);
  }, [selectedEventId, events]);


  const handleScanFailure = useCallback((err) => {
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const payload = await handleListEvents();
        setEvents(payload?.events || []);
      } catch (err) {
        console.error('載入活動清單失敗:', err);
      }
    })();
  }, []);

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
    const sourceEvent = ev
      ? {
          event_id: ev.event_id,
          event_name: ev.event_name,
          datetime_start: ev.datetime_start,
          type: ev.type,
        }
      : null;

    navigate('/customers/create', { state: { from: 'scan', sourceEvent } });
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            const match = events.find(ev => 
              `${ev.event_id} - ${ev.event_name} ${ev.datetime_start ? `(${ev.datetime_start})` : ''}` === e.target.value
            );
            if (match) {
              setSelectedEventId(match.event_id);
            } else {
              setSelectedEventId('');
            }
          }}
          onFocus={(e) => {
            setSearchTerm('');
            setSelectedEventId('');
          }}
          placeholder="輸入或選擇活動..."
          style={{ padding: 6, minWidth: 400 }}
        />
        <datalist id="events-list">
          {events.map((ev) => (
            <option key={ev.event_id} value={`${ev.event_id} - ${ev.event_name} ${ev.datetime_start ? `(${ev.datetime_start})` : ''}`} />
          ))}
        </datalist>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={startScanning} disabled={scanning || !selectedEventId}>
          {scanning ? 'Scanning...' : 'Start Scanning'}
        </button>
        <button type="button" onClick={stopScanning} disabled={!scanning}>
          Stop Scanning
        </button>
        <button
          type="button"
          onClick={handleQuickRegister}
          style={{ marginLeft: 8 }}
        >
          現場快速登記
        </button>
      </div>

      <div id="reader" style={{ width: 320, minHeight: 240, background: '#00000008', border: '1px solid #ccc' }} />

      <div style={{ marginTop: 16 }}>
        {selectedEventId && (
          <div style={{ marginBottom: 8, color: '#555' }}>
            目前簽到活動：<strong>
              {(() => {
                const ev = events.find(e => String(e.event_id) === String(selectedEventId));
                return ev ? `${ev.type || ''} ${ev.event_id} ${ev.event_name || ''} ${ev.datetime_start ? `(${ev.datetime_start})` : ''}` : selectedEventId;
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