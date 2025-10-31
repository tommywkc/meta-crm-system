import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock data - 在實際應用中這裡會從 API 獲取資料
  const [event, setEvent] = useState(null);
  
  useEffect(() => {
    // 模擬 API 調用
    const mockEvents = {
      'E1': {
        id: 'E1',
        name: 'AI Animation 9A',
        category: '課堂',
        schedule: '2025-11-12 19:00',
        seatsLimit: 60,
        remainingSeats: 4,
        status: '公開',
        description: '這是一個關於AI動畫製作的進階課程，適合有基礎經驗的學員參加。',
        instructor: '張老師',
        location: '教室A',
        duration: '3小時',
        price: 'HK$800',
        requirements: '需要自備筆記型電腦',
        materials: '課堂筆記、範例檔案',
        created_at: '2025-10-15 10:30:00',
        updated_at: '2025-10-20 14:15:00'
      },
      'E2': {
        id: 'E2',
        name: 'Seminar-SEP-03',
        category: '講座',
        schedule: '2025-09-03 14:00',
        seatsLimit: null,
        remainingSeats: null,
        status: '草稿',
        description: '關於最新科技趨勢的專題講座。',
        instructor: '李專家',
        location: '會議廳',
        duration: '2小時',
        price: '免費',
        requirements: '無特殊要求',
        materials: '講座簡報',
        created_at: '2025-08-20 09:00:00',
        updated_at: '2025-08-25 16:45:00'
      }
    };
    
    setEvent(mockEvents[id] || {});
  }, [id]);

  if (!event || !event.id) {
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
        <div><strong>ID:</strong> {event.id}</div>
        <div><strong>名稱:</strong> {event.name}</div>
        <div><strong>類別:</strong> {event.category}</div>
        <div><strong>場次/時間:</strong> {event.schedule}</div>
        <div><strong>狀態:</strong> {event.status}</div>
        
        {event.seatsLimit && (
          <>
            <div><strong>座位限制:</strong> {event.seatsLimit}</div>
            <div><strong>剩餘名額:</strong> {event.remainingSeats}</div>
          </>
        )}
        
        <div><strong>描述:</strong> {event.description || 'N/A'}</div>
        <div><strong>導師:</strong> {event.instructor || 'N/A'}</div>
        <div><strong>地點:</strong> {event.location || 'N/A'}</div>
        <div><strong>時長:</strong> {event.duration || 'N/A'}</div>
        <div><strong>價格:</strong> {event.price || 'N/A'}</div>
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