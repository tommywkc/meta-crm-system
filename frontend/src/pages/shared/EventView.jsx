import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { handleGetById } from '../../api/eventListAPI';
import WaitingListTable from '../../components/WaitingListTable';

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
  
  const [event, setEvent] = useState([]);
  // Note: isEnrolling is for future enrollment loading state
  const [isEnrolling] = useState(false);
  
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
      };
      fetchData();
    }, [id]);

  const handleEnroll = () => {
    navigate(`/events/${id}/apply`);
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
        <div><strong>類別:</strong> {event.type || 'N/A'}</div>
        <div><strong>開始時間:</strong> {event.datetime_start || 'N/A'}</div>
        <div><strong>結束時間:</strong> {event.datetime_end || 'N/A'}</div>
        <div><strong>狀態:</strong> {event.status || 'N/A'}</div>
        
        {event.capacity && (
          <>
            <div><strong>座位限制:</strong> {event.capacity}</div>
            <div><strong>剩餘名額:</strong> {event.remaining_seats}</div>
          </>
        )}
        
        <div><strong>描述:</strong> {event.description || 'N/A'}</div>
        <div><strong>講者 ID:</strong> {event.speaker_id || 'N/A'}</div>
        <div><strong>地點:</strong> {event.location || 'N/A'}</div>
        <div><strong>價格:</strong> {event.price ? `$ ${event.price}` : '免費'}</div>
        <div><strong>房間費用:</strong> {event.room_cost || 'N/A'}</div>
        <div><strong>建立時間:</strong> {event.create_time || 'N/A'}</div>
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