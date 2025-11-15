import React, { useEffect, useRef, useState, useCallback } from 'react';
import { handleListEvents } from '../../api/eventListAPI';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';



const Scan = () => {
  const navigate = useNavigate();
  const qrRef = useRef(null);          
  const hasStartedRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

 
  const handleScanSuccess = useCallback((decodedText) => {
    if (decodedText === lastResult) return;
    console.log('Scanned:', decodedText);
    setLastResult(decodedText);
  }, [lastResult]);


  const handleScanFailure = useCallback((err) => {
  }, []);

  // 載入活動列表供選擇
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

  // 現場快速登記：停止掃描並導向到建立客戶頁
  const handleQuickRegister = async () => {
    try {
      await stopScanning();
    } catch (_) {}

    // 將所選活動資訊一併帶到建立頁，供「來源」欄位預填
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
            目前簽到活動 ID：<strong>{selectedEventId}</strong>
          </div>
        )}
        <strong>Last Result:</strong> {lastResult ? <span style={{ color: 'green' }}>{lastResult}</span> : '---'}
      </div>
      {errorMsg && <div style={{ color: 'red', marginTop: 8 }}>{errorMsg}</div>}
    </div>
  );
};

export default Scan;