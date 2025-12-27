import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { handleGetById } from '../../api/eventListAPI';
import { handleGetById as handleGetUserById } from '../../api/customersListAPI';
import { handleListSessionsByEventId, handleGetSessionById, handleDeleteSession } from '../../api/sessionAPI';
import { handleCheckEnrollment } from '../../api/enrollmentAPI';
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
  const [speakerName, setSpeakerName] = useState('');
  const [selectedSessionName, setSelectedSessionName] = useState('all');
  // Note: isEnrolling is for future enrollment loading state
  const [isEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
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
        const data = await handleGetById(id);
        setEvent(data.event || {});
        
        // Fetch sessions for this event
        try {
          const sessionData = await handleListSessionsByEventId(id);
          setSessions(sessionData.sessions || []);
        } catch (err) {
          console.error('Failed to fetch sessions:', err);
          setSessions([]);
        }
        

        try {
          const enrollmentData = await handleCheckEnrollment(id, user?.id);
          if (enrollmentData != null) {
            setIsEnrolled(true);
          }
        } catch (err) {
          console.error('Failed to check enrollment:', err);
        }
        
      };
      fetchData();
    }, [id]);

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
          <button onClick={handleEnroll} disabled={isEnrolling} style={{ marginLeft: 8 }}>
            {isEnrolling ? '報名中...' : '報名'}
          </button>
        ) : null}
      </div>

      {/* Session list table */}
      <div style={{ marginTop: 40 }}>
        <h2>場次列表</h2>
        
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
          </div>
        )}
        
        <SessionListTable 
          sessions={
            selectedSessionName === 'all' 
              ? sessions 
              : sessions.filter(s => s.session_name === selectedSessionName)
          }
          role={user?.role}
          onEditSession={isAdmin ? handleEditSession : undefined}
          onEnrollSession={(isMember || isSalesOrLeader) ? handleEnrollSession : undefined}
          onDeleteSession={isAdmin ? onDeleteSession : undefined}
          isEnrolled={isEnrolled}
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