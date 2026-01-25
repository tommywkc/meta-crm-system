import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { handleGetById } from '../../api/eventListAPI';
import { handleGetById as handleGetUserById } from '../../api/customersListAPI';
import { handleListSessionsByEventId, handleGetSessionById, handleDeleteSession, handleListMyRegisteredSessionsByEvent } from '../../api/sessionAPI';
import { handleCheckEnrollment, handleListMyActiveEnrolledEvents } from '../../api/enrollmentAPI';
import { getStatusDisplay, getTypeDisplay, formatDateTimeForDisplay } from '../../utils/dateFormatter';
import WaitingListTable from '../../components/WaitingListTable';
import SessionListTable from '../../components/SessionListTable';

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
  
  const [event, setEvent] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [registeredSessionIds, setRegisteredSessionIds] = useState([]);
  const [speakerName, setSpeakerName] = useState('');
  const [selectedSessionName, setSelectedSessionName] = useState('all');
  const [selectedRound, setSelectedRound] = useState('all');
  // Note: isEnrolling is for future enrollment loading state
  const [isEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasActiveEnrollment, setHasActiveEnrollment] = useState(false);
  const hasShownErrorRef = useRef(false);
  
  // Mock waiting list data
  const mockWaiting = [
    {
      id: 'XXX',
      customerId: 1,
      customerName: 'XXX',
      contact: 'XXX',
      requestedClass: 'XXX',
      requestedDate: 'XXX',
      seatsNeeded: 1,
      status: 'XXX',
      submittedAt: 'XXX'
    },
    {
      id: 'XXX',
      customerId: null,
      customerName: 'XXX',
      contact: 'XXX',
      requestedClass: 'XXX',
      requestedDate: 'XXX',
      seatsNeeded: 2,
      status: 'XXX',
      submittedAt: 'XXX'
    }
  ];
    useEffect(() => {
      const fetchData = async () => {
      // 先抓活動資料；若後端回傳 403（非 OPEN 活動），會在這裡丟出 Error
      try {
        const data = await handleGetById(id);
        setEvent(data.event || {});
      } catch (err) {
        console.error('Failed to fetch event:', err);
        if (!hasShownErrorRef.current) {
        // 避免在嚴格模式或多次重渲染時彈兩次
        hasShownErrorRef.current = true;
        window.alert(err?.message || '暫時未能瀏覽未開放活動');
        // 回到上一頁（例如從「我的活動」列表點進來時就回去該頁）
        navigate(-1);
        }
        return;
      }

      // Fetch sessions for this event
      try {
        const sessionData = await handleListSessionsByEventId(id);
        setSessions(sessionData.sessions || []);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setSessions([]);
      }
		

      // isEnrolled：只代表「已確認報名」（CONFIRMED），給下方場次表使用
      try {
        const enrollmentData = await handleCheckEnrollment(id, user?.id);
        if (enrollmentData != null) {
          setIsEnrolled(true);
        } else {
          setIsEnrolled(false);
        }
      } catch (err) {
        console.error('Failed to check enrollment (confirmed only):', err);
        setIsEnrolled(false);
      }

      // hasActiveEnrollment：包含 PENDING 與 CONFIRMED，給上方活動「報名」按鈕使用
      try {
        const activePayload = await handleListMyActiveEnrolledEvents();
        const eventIds = Array.isArray(activePayload.eventIds) ? activePayload.eventIds : [];
        const active = eventIds.some(eventId => String(eventId) === String(id));
        setHasActiveEnrollment(active);
      } catch (err) {
        console.error('Failed to check active enrollment status:', err);
        setHasActiveEnrollment(false);
      }

      // Fetch registered session IDs for current user for this event (member only)
      if (userRole === 'member') {
        try {
          const payload = await handleListMyRegisteredSessionsByEvent(id);
          setRegisteredSessionIds(Array.isArray(payload.sessionIds) ? payload.sessionIds : []);
        } catch (err) {
          console.error('Failed to fetch registered sessions for this event:', err);
          setRegisteredSessionIds([]);
        }
      } else {
        setRegisteredSessionIds([]);
      }
		
      };
      fetchData();
    }, [id, user?.id, userRole, navigate]);

  // Fetch speaker name by speaker_id
  useEffect(() => {
    (async () => {
      const speakerId = event?.speaker_id;
      if (!speakerId) {
        setSpeakerName('');
        return;
      }
      try {
        const data = await handleGetUserById(speakerId);
        const name = data?.customer?.name || '';
        setSpeakerName(name);
      } catch (err) {
        console.error('Failed to fetch speaker name:', err);
        setSpeakerName('');
      }
    })();
  }, [event?.speaker_id]);

  const handleEnroll = () => {
    navigate(`/events/${id}/apply`);
  };

  const handleEditSession = (session_id) => {
    if (!session_id) return;
    navigate(`/sessions/${session_id}/edit`);
  };

  const onDeleteSession = async (session_id) => {
    if (!session_id) return;
    const payload = await handleGetSessionById(session_id);
    const findSessionData = payload?.session || {};
    if (window.confirm(`確認要刪除此場次？ \n ${findSessionData.session_name || ''} (${findSessionData.datetime_start ? formatDateTimeForDisplay(findSessionData.datetime_start) : 'N/A'})`)) {
      try {
        await handleDeleteSession(session_id);
        alert('場次刪除成功！');
        const sessionData = await handleListSessionsByEventId(id);
        setSessions(sessionData.sessions || []);
      } catch (err) {
        console.error('Failed to delete session:', err);
        alert('刪除場次失敗，請稍後再試');
      }
    }
  };

  const handleEnrollSession = (session_id) => {
    if (!session_id) return;
    navigate(`/events/${id}/enrollsession?session_id=${session_id}`);
  };



  if (!event || !event.event_id) {
    return (
      <div>
        <h1>找不到此講座/課堂</h1>
        <button onClick={() => navigate('/events')}>返回列表</button>
      </div>
    );
  }

  return (
    <div>
      <h1>查看講座/課堂詳細資料</h1>
      
      <div>
        <div><strong>ID:</strong> {event.event_id}</div>
        <div><strong>名稱:</strong> {event.event_name || 'N/A'}</div>
        <div><strong>類別:</strong> {getTypeDisplay(event.type) || 'N/A'}</div>
        <div><strong>開始時間:</strong> {event.datetime_start ? formatDateTimeForDisplay(event.datetime_start) : 'N/A'}</div>
        <div><strong>結束時間:</strong> {event.datetime_end ? formatDateTimeForDisplay(event.datetime_end) : 'N/A'}</div>
        <div><strong>狀態:</strong> {getStatusDisplay(event.status) || 'N/A'}</div>
        
        {event.capacity && (
          <>
            <div><strong>座位限制:</strong> {event.capacity}</div>
            <div><strong>剩餘名額:</strong> {event.remaining_seats}</div>
          </>
        )}
        
        <div><strong>描述:</strong> {event.description || 'N/A'}</div>
        <div>
          <strong>講者:</strong>{' '}
          {event.speaker_id
            ? (
              <>
                {speakerName ? `${speakerName}` : ' (載入中...)'}
              </>
            )
            : 'TBC'}
        </div>
        <div><strong>地點:</strong> {event.location || 'TBC'}</div>
  <div><strong>活動價格:</strong> {event.price == null || Number(event.price) === 0
    ? '免費'
    : `HK$ ${event.price}`}</div>
        {isAdmin && (
          <>
      <div><strong>房間費用:</strong> {event.room_cost == null || Number(event.room_cost) === 0
    ? 'N/A'
    : `HK$ ${event.room_cost}`}</div>
            <div><strong>建立時間:</strong> {formatDateTimeForDisplay(event.create_time)|| 'N/A'}</div>
          </>
        )}
      </div>
      
      <div>
        <button onClick={() => navigate('/events')}>返回列表</button>
        {isAdmin ? (
          <button onClick={() => navigate(`/events/${id}/edit`)} style={{ marginLeft: 8 }}>編輯</button>
        ) : isMember || isSalesOrLeader ? (
          <button
            onClick={hasActiveEnrollment ? undefined : handleEnroll}
            disabled={isEnrolling || hasActiveEnrollment}
            style={{ marginLeft: 8 }}
          >
            {hasActiveEnrollment ? '已報名' : (isEnrolling ? '報名中...' : '報名')}
          </button>
        ) : null}
        {(isAdmin || isSalesOrLeader) && (
          <button
            onClick={() => navigate(`/events/${id}/enrolled`)}
            style={{ marginLeft: 8 }}
          >
            查看名單
          </button>
        )}
        <button
          onClick={() => navigate(`/events/${id}/homework`)}
          style={{ marginLeft: 8 }}
        >
          功課
        </button>
      </div>

      {/* Session list table */}
      <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>場次列表</h2>
      </div>
        
        {/* Session name filter */}
        {sessions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="session-filter" style={{ marginRight: 8, fontWeight: 'bold' }}>
              場次名稱:
            </label>
            <select
              id="session-filter"
              value={selectedSessionName}
              onChange={(e) => setSelectedSessionName(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '200px'
              }}
            >
              <option value="all">全部場次</option>
              {/* Get unique session names */}
              {[...new Set(sessions.map(s => s.session_name))]
                .filter(name => name) // Filter out null/undefined
                .map(name => (
                  <option key={name} value={name}>
                    {name} ({sessions.filter(s => s.session_name === name).length})
                  </option>
                ))}
            </select>
            
            {/* Round filter */}
            {sessions.some(s => s.round != null) && (
              <>
                <label htmlFor="round-filter" style={{ marginLeft: 16, marginRight: 8, fontWeight: 'bold' }}>
                  期數:
                </label>
                <select
                  id="round-filter"
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    minWidth: '120px'
                  }}
                >
                  <option value="all">全部期數</option>
                  {[...new Set(sessions.map(s => s.round))]
                    .filter(r => r != null)
                    .sort((a, b) => a - b)
                    .map(r => (
                      <option key={r} value={String(r)}>
                        第 {r} 期
                      </option>
                    ))}
                </select>
              </>
            )}
          </div>
        )}
        <div>
          {isAdmin && (
              <button onClick={() => navigate(`/events/${id}/sessions/create`)}>
                新增場次
              </button>
            )}
        </div>
        
        <SessionListTable 
          sessions={(() => {
            let filtered = sessions;
            if (selectedSessionName !== 'all') {
              filtered = filtered.filter(s => s.session_name === selectedSessionName);
            }
            if (selectedRound !== 'all') {
              filtered = filtered.filter(s => String(s.round) === selectedRound);
            }
            return filtered;
          })()}
          role={user?.role}
          onEditSession={isAdmin ? handleEditSession : undefined}
          onEnrollSession={(isMember || isSalesOrLeader) ? handleEnrollSession : undefined}
          onDeleteSession={isAdmin ? onDeleteSession : undefined}
          isEnrolled={isEnrolled}
				registeredSessionIds={registeredSessionIds}
        />
      </div>

  {/* Waiting list table - Admin only */}
      {isAdmin && (
        <div style={{ marginTop: 40 }}>
          <h2>等待清單</h2>
          <WaitingListTable data={mockWaiting} />
        </div>
      )}
    </div>
  );
};

export default EventView;