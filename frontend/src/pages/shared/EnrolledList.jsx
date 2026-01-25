import React, { useState, useEffect } from 'react';
import CustomersTable from '../../components/CustomersTable';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListConfirmedUsersByEvent } from '../../api/enrollmentAPI';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleGetSessionById, handleListSessionAttendees, handleDeleteSessionRegistration } from '../../api/sessionAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

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

  const [members, setMembers] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          res = await handleListConfirmedUsersByEvent(eventId);
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
          issued_certificate: c.issued_certificate,
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

  const isSessionMode = Boolean(sessionId);

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

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <>
          {members.length === 0 ? (
            <p>目前沒有已確認報名的會員。</p>
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
                  header: '證書',
                  render: (customer) => (customer.issued_certificate ? '已發放' : '未發放')
                }
              ]}
              renderActions={(customer) => {
                if (isSessionMode) {
                  return (
                    <button
                      style={{ color: 'red' }}
                      onClick={() => handleDeleteRegistration(customer.registration_id)}
                    >
                      刪除報名
                    </button>
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
                      onClick={() => {
                        if (!customer.payment_id) {
                          alert('找不到付款紀錄，無法上傳證書');
                          return;
                        }
                        alert('上傳證書（前端按鈕已加入）');
                      }}
                    >
                      上傳證書
                    </button>
                  </>
                );
              }}
            />
          )}

          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate(-1)}>返回上一頁</button>
          </div>
        </>
      )}
    </div>
  );
};

export default EnrolledList;
