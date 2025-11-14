import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';



const Scan = () => {
  const qrRef = useRef(null);          
  const hasStartedRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

 
  const handleScanSuccess = useCallback((decodedText) => {
    if (decodedText === lastResult) return;
    console.log('Scanned:', decodedText);
    setLastResult(decodedText);
  }, [lastResult]);


  const handleScanFailure = useCallback((err) => {
  }, []);

  const startScanning = async () => {
    if (scanning || hasStartedRef.current) return;
    setErrorMsg(null);
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

      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button type="button" onClick={startScanning} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Start Scanning'}
        </button>
        <button type="button" onClick={stopScanning} disabled={!scanning}>
          Stop Scanning
        </button>
      </div>

      <div id="reader" style={{ width: 320, minHeight: 240, background: '#00000008', border: '1px solid #ccc' }} />

      <div style={{ marginTop: 16 }}>
        <strong>Last Result:</strong> {lastResult ? <span style={{ color: 'green' }}>{lastResult}</span> : '---'}
      </div>
      {errorMsg && <div style={{ color: 'red', marginTop: 8 }}>{errorMsg}</div>}
    </div>
  );
};

export default Scan;