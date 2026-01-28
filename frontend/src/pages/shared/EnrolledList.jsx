import React, { useState, useEffect, useRef, useCallback } from 'react';
import CustomersTable from '../../components/CustomersTable';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListConfirmedUsersByEvent } from '../../api/enrollmentAPI';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleGetSessionById, handleListSessionAttendees, handleDeleteSessionRegistration } from '../../api/sessionAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleUploadCertificate } from '../../api/certificatesAPI';
import { handleUploadReceipt } from '../../api/receiptsAPI';
import { Html5Qrcode } from 'html5-qrcode';
import { handleScanAttendance } from '../../api/attendanceAPI';
import { handleGetUserByQRToken } from '../../api/customersListAPI';

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
  const [scanMessage, setScanMessage] = useState(null); // string message shown next to camera
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'fail' | null

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
  // QR scanner refs/states (session-mode only)
  const qrRef = useRef(null);
  const hasStartedRef = useRef(false);
  const scanningCooldownRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);
  const SCAN_COOLDOWN_MS = 2500;
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [qrErrorMsg, setQrErrorMsg] = useState(null);
  const [scanUser, setScanUser] = useState(null); // e.g. 林淑芬（50008）
  const [scanDetail, setScanDetail] = useState(null); // e.g. 簽到時間：...

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
  // Helper: 從各種可能的 error/payload 形態中取出 user 資訊
  const extractUserFromPayload = (p, err) => {
    const src = p || (err?.response && err.response.data) || err?.data || err || null;
    if (!src) return null;
    // common locations
    const candidates = [
      src.user,
      src.registration && src.registration.user,
      src.data && src.data.user,
      src.user_info,
      src.userData,
      // fallback to top-level fields
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

  // Auto-start QR scanner when in session mode and a session is selected
  const handleScanSuccess = useCallback(async (decodedText) => {
    console.log('Scanned:', decodedText);
    // ignore scans during cooldown to avoid repeated detections
    if (scanningCooldownRef.current) {
      console.debug('Scan ignored due to cooldown');
      return;
    }
    scanningCooldownRef.current = true;
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    cooldownTimeoutRef.current = setTimeout(() => {
      scanningCooldownRef.current = false;
      cooldownTimeoutRef.current = null;
    }, SCAN_COOLDOWN_MS);
    if (!sessionId) return;
    const selectedSession = sessionInfo;
    if (!selectedSession) {
      try { setScanStatus('fail'); setScanUser(null); setScanDetail('找不到場次資訊，無法簽到'); setLastScanResult('簽到失敗'); } catch (e) {}
      return;
    }

    let payload;
    try {
      payload = await handleScanAttendance({ qr_token: decodedText, session_id: selectedSession.session_id });
    } catch (err) {
      // 支援多種 error/payload 形態 (err.payload, err.response.data, err.data 等)
      const p = err?.payload || (err?.response && err.response.data) || err?.data || null;
      // 若後端回傳 payload（例如 409 已簽到），也把 registration 記錄到 localSignIns
      try {
        const regId = p?.registration?.registration_id || err?.registration?.registration_id;
        if (regId) {
          const sessionKey = String(sessionId);
          setLocalSignIns((prev) => {
            const next = { ...(prev || {}) };
            if (!next[sessionKey]) next[sessionKey] = {};
            next[sessionKey][regId] = true;
            try { window.localStorage.setItem('localSignIns', JSON.stringify(next)); } catch (e) { /* ignore */ }
            return next;
          });
        }
      } catch (e) {
        console.warn('Failed to mark local sign-in from error payload:', e);
      }

      try {
        // 先用 helper 嘗試取得用戶資訊（與成功處理時相同邏輯）
        const userInfo = extractUserFromPayload(p, err);
        if (userInfo) {
          const userName = userInfo.name || '未知用戶';
          const userId = userInfo.id ? `（${userInfo.id}）` : '';
          const attendTimeRaw = p?.attendance?.attend_time || p?.attend_time || p?.attendance_time || null;
          setScanUser(`${userName}${userId}`);
          setScanDetail(`簽到時間：${attendTimeRaw || '—'}`);
          try { setScanStatus('success'); } catch (e) {}
          try { setLastScanResult('簽到成功'); } catch (e) {}
        } else {
          // 失敗但嘗試顯示任何可用的用戶資訊
          setScanStatus('fail');
          // fallback: 試試用 qr_token 去抓用戶資料
          try {
            const fallback = await handleGetUserByQRToken(decodedText);
            const cust = fallback?.customer || fallback?.user || fallback;
            if (cust) {
              const cname = cust.name || cust.user_name || '未知用戶';
              const cid = cust.user_id || cust.id || null;
              setScanUser(`${cname}${cid ? `（${cid}）` : ''}`);
            } else {
              setScanUser(null);
            }
          } catch (e2) {
            // ignore fallback failure
            setScanUser(null);
          }
          const errAttendTime = p?.attendance?.attend_time || p?.attend_time || p?.attendance_time || null;
          const errMsg = p?.message || err?.message || '簽到失敗，請稍後再試';
          const detail = errAttendTime ? `簽到時間：${errAttendTime}` : errMsg;
          setScanDetail(detail);
          setLastScanResult('簽到失敗');
        }
      } catch (e) {
        console.warn('Error while handling scan error payload:', e);
        try { setScanStatus('fail'); setScanUser(null); setScanDetail(err?.message || '簽到失敗'); setLastScanResult('簽到失敗'); } catch (e2) {}
      }
      return;
    }

    const user = payload?.user;
    // 如果後端回傳 registration，將該 registration_id 標記為已簽到（frontend-only）
    try {
      const regId = payload?.registration?.registration_id;
      if (regId) {
        const sessionKey = String(sessionId);
        const rid = String(regId);
        setLocalSignIns((prev) => {
          const next = { ...(prev || {}) };
          if (!next[sessionKey]) next[sessionKey] = {};
          next[sessionKey] = { ...(next[sessionKey] || {}) };
          next[sessionKey][rid] = true;
          try { window.localStorage.setItem('localSignIns', JSON.stringify(next)); } catch (e) { /* ignore */ }
          return next;
        });
      }
    } catch (e) {
      console.warn('Failed to mark local sign-in:', e);
    }
    const userName = user?.name || '未知用戶';
    const userId = user?.user_id ? `（${user.user_id}）` : '';
    const attendStatus = payload?.attendance?.status;
    const title = payload?.message || (attendStatus === 'G' ? '簽到成功' : '簽到完成');
    const attendTimeRaw = payload?.attendance?.attend_time;
    // show success/failure message in UI instead of alert (two-line format)
    try {
      setScanUser(`${userName}${userId}`);
      setScanDetail(`簽到時間：${attendTimeRaw || '—'}`);
      try { setScanStatus('success'); } catch (e) {}
      try { setLastScanResult('簽到成功'); } catch (e) {}
    } catch (e) {}
  }, [sessionId, sessionInfo]);

  const handleScanFailure = useCallback((err) => {
    // ignore per-scan failures
  }, []);

  const startQrScanning = async () => {
    if (scanning || hasStartedRef.current) return;
    setQrErrorMsg(null);
    if (!sessionId) return;
    try {
      const containerId = 'reader-enrolled';
      // Ensure any existing global instances are stopped to avoid duplicate cameras
      try { await stopAllGlobalInstances(); } catch (e) { /* ignore */ }
      // If a global instance exists for this container, stop/clear it first
      const existing = getGlobalInstance(containerId);
      if (existing && existing !== qrRef.current) {
        try {
          try {
            const stopRes = existing.stop();
            if (stopRes && typeof stopRes.then === 'function') await stopRes.catch(() => {});
          } catch (_) {}
          try {
            const clearRes = existing.clear();
            if (clearRes && typeof clearRes.then === 'function') await clearRes.catch(() => {});
          } catch (_) {}
        } catch (e) {
          // ignore
        }
        try {
          const containerCleanup = document.getElementById(containerId);
          if (containerCleanup) while (containerCleanup.firstChild) containerCleanup.removeChild(containerCleanup.firstChild);
        } catch (e) {}
        clearGlobalInstance(containerId);
      }

      // Defensive: ensure container is clean to avoid duplicate <video> elements
      const container = document.getElementById(containerId);
      if (container) {
        while (container.firstChild) container.removeChild(container.firstChild);
      }
      if (!qrRef.current) {
        qrRef.current = new Html5Qrcode(containerId);
      }
      setGlobalInstance(containerId, qrRef.current);
      hasStartedRef.current = true;
      await qrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10 },
        handleScanSuccess,
        handleScanFailure
      );
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setQrErrorMsg(err.message || '啟動掃描失敗');
      hasStartedRef.current = false;
    }
  };

  const stopQrScanning = async () => {
    setQrErrorMsg(null);
    // Use safe stop/clear to handle both sync throws and rejected promises
    const containerId = 'reader-enrolled';
    // prefer local ref, fallback to any global instance
    const inst = qrRef.current || getGlobalInstance(containerId);
    if (!inst) return;
    try {
      // stop may throw synchronously or return a promise
      try {
        const stopRes = inst.stop();
        if (stopRes && typeof stopRes.then === 'function') {
          await stopRes.catch((e) => console.warn('stop promise rejected:', e));
        }
      } catch (e) {
        console.warn('stop threw synchronously:', e);
      }

      try {
        const clearRes = inst.clear();
        if (clearRes && typeof clearRes.then === 'function') {
          await clearRes.catch((e) => console.warn('clear promise rejected:', e));
        }
      } catch (e) {
        console.warn('clear threw synchronously:', e);
      }
    } finally {
      try { clearGlobalInstance(containerId); } catch (e) {}
      // remove any leftover DOM inside container
      try {
        const container = document.getElementById(containerId);
        if (container) {
          while (container.firstChild) container.removeChild(container.firstChild);
        }
      } catch (e) { /* ignore */ }
      qrRef.current = null;
      hasStartedRef.current = false;
      setScanning(false);
    }
  };

  // Do NOT auto-start scanner on mount. Start manually via button.
  // Ensure we stop/clear any global instances when leaving the page.
  useEffect(() => {
    if (!isSessionMode) return;
    return () => {
      try {
        // stopAllGlobalInstances handles sync/async stop+clear and DOM cleanup
        stopAllGlobalInstances();
      } catch (e) {
        console.error('Failed to stop global scanners on unmount:', e);
      }
      try {
        if (cooldownTimeoutRef.current) {
          clearTimeout(cooldownTimeoutRef.current);
          cooldownTimeoutRef.current = null;
          scanningCooldownRef.current = false;
        }
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionMode, sessionId]);

  // 載入已報名會員清單（活動或場次）
  useEffect(() => {
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
        const mapped = customers.map((c) => ({
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
          issued_certificate: c.issued_certificate,
          issued_receipt: c.issued_receipt,
        }));
        setMembers(mapped);
      } catch (err) {
        console.error('載入已報名會員清單失敗:', err);
        setError(err.message || '載入已報名會員清單失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [eventId, sessionId]);

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
            <p>
              活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}
            </p>
          )}
          {isSessionMode && sessionInfo && (
            <p>
              場次 ID: {sessionInfo.session_id} ｜ 場次名稱: {sessionInfo.session_name || 'N/A'} ｜ 時間: {sessionInfo.datetime_start ? formatDateTimeForDisplay(sessionInfo.datetime_start) : 'N/A'}
            </p>
          )}
        </div>

        {isSessionMode && (
          <div style={{ width: 340, border: '1px solid #eee', padding: 12, borderRadius: 4, background: '#fafafa' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <button type="button" onClick={startQrScanning} disabled={scanning || !sessionId}>
                {scanning ? 'Scanning...' : 'Start Scanner'}
              </button>
              <button type="button" onClick={stopQrScanning} disabled={!scanning}>
                Stop Scanner
              </button>
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
                    <div style={{ padding: '6px 8px', borderRadius: 6, backgroundColor: scanStatus === 'success' ? '#e6ffed' : scanStatus === 'fail' ? '#fff0f0' : '#f5f5f5', color: scanStatus === 'success' ? '#1b8b46' : scanStatus === 'fail' ? '#a12a2a' : '#333', fontSize: 13, lineHeight: '1.2', whiteSpace: 'pre-line' }}>
                      {scanDetail}
                    </div>
                  ) : (
                    <div style={{ color: '#777', fontSize: 13 }}></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
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
                {
                  header: '報名狀態',
                  render: (customer) => translateStatus(customer.status)
                },
                // Add sign-in column only in session mode
                ...(isSessionMode ? [
                  {
                    header: '簽到',
                    render: (customer) => {
                      const sessionKey = String(sessionId);
                      const rid = String(customer.registration_id);
                      const signed = !!(localSignIns && localSignIns[sessionKey] && localSignIns[sessionKey][rid]);
                      return signed ? 'Y' : 'N';
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
                  return (
                      <>
                        <button
                          style={{ marginRight: 8, position: 'relative', zIndex: 2000 }}
                          onClick={() => toggleLocalSignIn(customer.registration_id)}
                        >
                          {(() => {
                            const sessionKey = String(sessionId);
                            const rid = String(customer.registration_id);
                            const signed = !!(localSignIns && localSignIns[sessionKey] && localSignIns[sessionKey][rid]);
                            return signed ? '取消簽到' : '簽到';
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
