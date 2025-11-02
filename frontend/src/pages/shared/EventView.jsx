import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById } from '../../api/eventListAPI';

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState([]);
    useEffect(() => {
      const fetchData = async () => {
        const data = await handleGetById(id);
        setEvent(data.event || {});
      };
      fetchData();
    }, [id]);


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
        <button onClick={() => navigate(`/events/${id}/edit`)}>編輯</button>
      </div>
    </div>
  );
};

export default EventView;