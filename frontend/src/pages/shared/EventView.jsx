import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { handleGetById } from '../../api/eventListAPI';

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
  
  const [event, setEvent] = useState([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  
  // Mock waiting list data
  const mockWaiting = [
    {
      id: 'W1',
      customerId: 1,
      customerName: '陳小明',
      contact: '9123-4567',
      requestedClass: 'AI Animation 9A',
      requestedDate: '2025-11-12',
      seatsNeeded: 1,
      status: '候補',
      submittedAt: '2025-10-20 09:12'
    },
    {
      id: 'W2',
      customerId: null,
      customerName: '劉小姐（未記錄）',
      contact: '9876-0011',
      requestedClass: 'Seminar-SEP-03',
      requestedDate: '2025-09-03',
      seatsNeeded: 2,
      status: '已通知',
      submittedAt: '2025-10-22 14:30'
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

  const handleApprove = (row) => {
    alert(`模擬：已核准 ${row.id}（${row.customerName}）`);
  };
  const handleNotify = (row) => {
    alert(`模擬：已通知 ${row.contact}（${row.customerName}）`);
  };
  const handleReject = (row) => {
    const ok = window.confirm(`確定要拒絕候補 ${row.id} 嗎？`);
    if (ok) alert(`模擬：已拒絕 ${row.id}`);
  };
  const handleViewCustomer = (row) => {
    if (row.customerId) navigate(`/customers/${row.customerId}`);
    else alert('此候補沒有綁定客戶資料');
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
        <div><strong>名稱:</strong> {event.name}</div>
        <div><strong>類別:</strong> {event.category}</div>
        <div><strong>Start Date:</strong> {event.datetime_start}</div>
        <div><strong>End Date:</strong> {event.datetime_end}</div>
        <div><strong>狀態:</strong> {event.status}</div>
        
        {event.capacity && (
          <>
            <div><strong>座位限制:</strong> {event.capacity}</div>
            <div><strong>剩餘名額:</strong> {event.remaining_seats}</div>
          </>
        )}
        
        <div><strong>描述:</strong> {event.description || 'N/A'}</div>
        <div><strong>導師:</strong> {event.speaker_id || 'N/A'}</div>
        <div><strong>地點:</strong> {event.location || 'N/A'}</div>
        <div><strong>價格:</strong> {event.price || '免費'}</div>
        <div><strong>要求:</strong> {event.requirements || 'N/A'}</div>
        <div><strong>教材:</strong> {event.materials || 'N/A'}</div>
        <div><strong>建立時間:</strong> {event.created_at}</div>
        <div><strong>最後更新:</strong> {event.updated_at}</div>
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
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>候補編號</th>
                <th style={thTdStyle}>姓名 / 連絡</th>
                <th style={thTdStyle}>申請課堂</th>
                <th style={thTdStyle}>申請日期</th>
                <th style={thTdStyle}>人數</th>
                <th style={thTdStyle}>狀態</th>
                <th style={thTdStyle}>送出時間</th>
                <th style={thTdStyle}>動作</th>
              </tr>
            </thead>
            <tbody>
              {mockWaiting.map((r) => (
                <tr key={r.id}>
                  <td style={thTdStyle}>{r.id}</td>
                  <td style={thTdStyle}>
                    <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.contact}</div>
                  </td>
                  <td style={thTdStyle}>{r.requestedClass}</td>
                  <td style={thTdStyle}>{r.requestedDate}</td>
                  <td style={thTdStyle}>{r.seatsNeeded}</td>
                  <td style={thTdStyle}>{r.status}</td>
                  <td style={thTdStyle}>{r.submittedAt}</td>
                  <td style={thTdStyle}>
                    <button onClick={() => handleApprove(r)} style={{ marginRight: 8 }}>核准</button>
                    <button onClick={() => handleNotify(r)} style={{ marginRight: 8 }}>通知</button>
                    <button onClick={() => handleReject(r)} style={{ marginRight: 8 }}>拒絕</button>
                    <button onClick={() => handleViewCustomer(r)}>查看客戶</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventView;