import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { handleScanAttendance } from '../api/attendanceAPI';
import { handleGetUserByQRToken } from '../api/customersListAPI';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

// A self-contained Scanner component that encapsulates Html5Qrcode lifecycle
// Props:
// - sessionId, sessionInfo, eventInfo
// - onMarkLocalSignIn(sessionId, registrationId)
// - onQuickRegister()  (optional) -- parent can stop scanner / navigate
const SCAN_COOLDOWN_MS = 2500;

const Scanner = ({ sessionId, sessionInfo, eventInfo, onMarkLocalSignIn, onQuickRegister }) => {
  const qrRef = useRef(null);
  const hasStartedRef = useRef(false);
  const scanningCooldownRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [qrErrorMsg, setQrErrorMsg] = useState(null);
  const [scanUser, setScanUser] = useState(null);
  const [scanDetail, setScanDetail] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const ensureGlobalRegistry = () => {
    if (!window.__html5qrcode_instances) window.__html5qrcode_instances = {};
    return window.__html5qrcode_instances;
  };
  const setGlobalInstance = (containerId, inst) => { const reg = ensureGlobalRegistry(); reg[containerId] = inst; };
  const getGlobalInstance = (containerId) => { const reg = ensureGlobalRegistry(); return reg[containerId]; };
  const clearGlobalInstance = (containerId) => { const reg = ensureGlobalRegistry(); delete reg[containerId]; };
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

  const extractUserFromPayload = (p, err) => {
    const src = p || (err?.response && err.response.data) || err?.data || err || null;
    if (!src) return null;
    const candidates = [
      src.user,
      src.registration && src.registration.user,
      src.data && src.data.user,
      src.user_info,
      src.userData,
      { name: src.name, user_id: src.user_id },
      { name: src.user_name || src.display_name || src.nickname, user_id: src.user_id || src.id },
    ];
    for (const c of candidates) {
      if (!c) continue;
      const name = c.name || c.user_name || c.display_name || c.nickname || null;
      const id = c.user_id || c.userId || c.id || null;
      if (name || id) return { name: name || '未知用戶', id };
    }
    return null;
  };

  const markLocalSignIn = (registration_id) => {
    if (!onMarkLocalSignIn || !sessionId || !registration_id) return;
    try { onMarkLocalSignIn(String(sessionId), String(registration_id)); } catch (e) { console.warn('markLocalSignIn failed', e); }
  };

  const handleScanSuccess = useCallback(async (decodedText) => {
    if (scanningCooldownRef.current) return;
    scanningCooldownRef.current = true;
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    cooldownTimeoutRef.current = setTimeout(() => { scanningCooldownRef.current = false; cooldownTimeoutRef.current = null; }, SCAN_COOLDOWN_MS);

    if (!sessionId) return;
    const selectedSession = sessionInfo;
    if (!selectedSession) {
      setScanStatus('fail'); setScanUser(null); setScanDetail('找不到場次資訊，無法簽到'); setLastScanResult('簽到失敗');
      return;
    }

    let payload;
    try {
      payload = await handleScanAttendance({ qr_token: decodedText, session_id: selectedSession.session_id });
    } catch (err) {
      const p = err?.payload || (err?.response && err.response.data) || err?.data || null;
      try {
        const regId = p?.registration?.registration_id || err?.registration?.registration_id;
        if (regId) markLocalSignIn(regId);
      } catch (e) { console.warn(e); }

      try {
        const userInfo = extractUserFromPayload(p, err);
        if (userInfo) {
          const userName = userInfo.name || '未知用戶';
          const userId = userInfo.id ? `（${userInfo.id}）` : '';
          const attendTimeRaw = p?.attendance?.attend_time || p?.attend_time || p?.attendance_time || null;
          setScanUser(`${userName}${userId}`);
          setScanDetail(`簽到時間：${attendTimeRaw || '—'}`);
          setScanStatus('success'); setLastScanResult('簽到成功');
        } else {
          setScanStatus('fail');
          try {
            const fallback = await handleGetUserByQRToken(decodedText);
            const cust = fallback?.customer || fallback?.user || fallback;
            if (cust) {
              const cname = cust.name || cust.user_name || '未知用戶';
              const cid = cust.user_id || cust.id || null;
              setScanUser(`${cname}${cid ? `（${cid}）` : ''}`);
            } else setScanUser(null);
          } catch (e2) { setScanUser(null); }
          const errAttendTime = p?.attendance?.attend_time || p?.attend_time || p?.attendance_time || null;
          const errMsg = p?.message || err?.message || '簽到失敗，請稍後再試';
          const detail = errAttendTime ? `簽到時間：${errAttendTime}` : errMsg;
          setScanDetail(detail);
          setLastScanResult('簽到失敗');
        }
      } catch (e) {
        console.warn('Error handling error payload', e);
        setScanStatus('fail'); setScanUser(null); setScanDetail(err?.message || '簽到失敗'); setLastScanResult('簽到失敗');
      }
      return;
    }

    try {
      const regId = payload?.registration?.registration_id;
      if (regId) markLocalSignIn(regId);
    } catch (e) {}

    const user = payload?.user;
    const userName = user?.name || '未知用戶';
    const userId = user?.user_id ? `（${user.user_id}）` : '';
    const attendTimeRaw = payload?.attendance?.attend_time;
    setScanUser(`${userName}${userId}`);
    setScanDetail(`簽到時間：${attendTimeRaw || '—'}`);
    setScanStatus('success'); setLastScanResult('簽到成功');
  }, [sessionId, sessionInfo]);

  const handleScanFailure = useCallback((err) => {}, []);

  const startQrScanning = async () => {
    if (scanning || hasStartedRef.current) return;
    setQrErrorMsg(null);
    if (!sessionId) return;
    try {
      const containerId = 'reader-enrolled';
      try { await stopAllGlobalInstances(); } catch (_) {}
      const existing = getGlobalInstance(containerId);
      if (existing && existing !== qrRef.current) {
        try { const stopRes = existing.stop(); if (stopRes && typeof stopRes.then === 'function') await stopRes.catch(() => {}); } catch (_) {}
        try { const clearRes = existing.clear(); if (clearRes && typeof clearRes.then === 'function') await clearRes.catch(() => {}); } catch (_) {}
        try { const containerCleanup = document.getElementById(containerId); if (containerCleanup) while (containerCleanup.firstChild) containerCleanup.removeChild(containerCleanup.firstChild); } catch (e) {}
        clearGlobalInstance(containerId);
      }
      const container = document.getElementById(containerId);
      if (container) { while (container.firstChild) container.removeChild(container.firstChild); }
      if (!qrRef.current) qrRef.current = new Html5Qrcode(containerId);
      setGlobalInstance(containerId, qrRef.current);
      hasStartedRef.current = true;
      await qrRef.current.start({ facingMode: 'environment' }, { fps: 10 }, handleScanSuccess, handleScanFailure);
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setQrErrorMsg(err.message || '啟動掃描失敗');
      hasStartedRef.current = false;
    }
  };

  const stopQrScanning = async () => {
    setQrErrorMsg(null);
    const containerId = 'reader-enrolled';
    const inst = qrRef.current || getGlobalInstance(containerId);
    if (!inst) return;
    try {
      try { const stopRes = inst.stop(); if (stopRes && typeof stopRes.then === 'function') await stopRes.catch((e) => console.warn('stop promise rejected:', e)); } catch (e) { console.warn('stop threw synchronously:', e); }
      try { const clearRes = inst.clear(); if (clearRes && typeof clearRes.then === 'function') await clearRes.catch((e) => console.warn('clear promise rejected:', e)); } catch (e) { console.warn('clear threw synchronously:', e); }
    } finally {
      try { clearGlobalInstance(containerId); } catch (e) {}
      try { const container = document.getElementById(containerId); if (container) { while (container.firstChild) container.removeChild(container.firstChild); } } catch (e) {}
      qrRef.current = null; hasStartedRef.current = false; setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      try { stopAllGlobalInstances(); } catch (e) {}
      try { if (cooldownTimeoutRef.current) { clearTimeout(cooldownTimeoutRef.current); cooldownTimeoutRef.current = null; scanningCooldownRef.current = false; } } catch (e) {}
    };
  }, []);

  return (
    <div style={{ width: 340, border: '1px solid #eee', padding: 12, borderRadius: 4, background: '#fafafa' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={startQrScanning} disabled={scanning || !sessionId}>{scanning ? 'Scanning...' : 'Start Scanner'}</button>
        <button type="button" onClick={stopQrScanning} disabled={!scanning}>Stop Scanner</button>
        {eventInfo?.type === 'SEMINAR' && onQuickRegister && (
          <button type="button" onClick={onQuickRegister} style={{ marginLeft: 8 }}>現場快速登記</button>
        )}
        <div style={{ color: '#555', marginLeft: 'auto' }}>{qrErrorMsg && <span style={{ color: 'red' }}>{qrErrorMsg}</span>}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div id="reader-enrolled" style={{ width: 160, height: 160, minHeight: 160, background: 'transparent', border: '1px solid #ccc', overflow: 'hidden', borderRadius: 4 }} />
        <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ marginBottom: 4 }}>
              <strong>狀態：</strong> <span style={{ color: scanStatus === 'success' ? 'green' : scanStatus === 'fail' ? 'red' : 'inherit' }}>{lastScanResult || ''}</span>
            </div>
            <div>
              <strong>用戶：</strong> <span>{scanUser || ''}</span>
            </div>
          </div>
          <div style={{ minHeight: 44 }}>
            {scanDetail ? (
              <div style={{ padding: '6px 8px', borderRadius: 6, backgroundColor: scanStatus === 'success' ? '#e6ffed' : scanStatus === 'fail' ? '#fff0f0' : '#f5f5f5', color: scanStatus === 'success' ? '#1b8b46' : scanStatus === 'fail' ? '#a12a2a' : '#333', fontSize: 13, lineHeight: '1.2', whiteSpace: 'pre-line' }}>{scanDetail}</div>
            ) : (
              <div style={{ color: '#777', fontSize: 13 }}></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
