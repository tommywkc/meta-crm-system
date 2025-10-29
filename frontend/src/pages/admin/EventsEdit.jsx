import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const mockClasses = {
  E1: {
    id: 'E1',
    name: 'AI Animation 9A',
    category: '課堂',
    schedule: '2025-11-12 19:00',
    seatsLimit: 60,
    remainingSeats: 4,
    status: '公開',
    instructor: '王老師',
    location: 'A教室'
  },
  E2: {
    id: 'E2',
    name: 'Seminar-SEP-03',
    category: '講座',
    schedule: '2025-09-03 14:00',
    seatsLimit: null,
    remainingSeats: null,
    status: '草稿',
    instructor: 'Guest',
    location: '大廳'
  }
};

const EventsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const c = id ? (mockClasses[id] || { id, name: '', category: '', schedule: '', seatsLimit: '', status: '草稿', instructor: '', location: '' }) : { name: '', category: '', schedule: '', seatsLimit: '', status: '草稿', instructor: '', location: '' };

  const [name, setName] = useState(c.name);
  const [category, setCategory] = useState(c.category);
  const [schedule, setSchedule] = useState(c.schedule);
  const [seatsLimit, setSeatsLimit] = useState(c.seatsLimit);
  const [status, setStatus] = useState(c.status);
  const [instructor, setInstructor] = useState(c.instructor || '');
  const [location, setLocation] = useState(c.location || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log and navigate back to events list
    console.log('Save event (mock):', { id, name, category, schedule, seatsLimit, status, instructor, location });
    alert('已模擬儲存（不會真的送出）');
    navigate('/events');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{id ? '編輯課堂/講座' : '建立課堂/講座'}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
        <div style={{ marginBottom: 8 }}>
          <label>名稱</label>
          <br />
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>類別</label>
          <br />
          <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 8 }} placeholder="例如：課堂 / 講座" />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>場次/時間（YYYY-MM-DD HH:mm）</label>
          <br />
          <input value={schedule} onChange={(e) => setSchedule(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>講師</label>
            <br />
            <input value={instructor} onChange={(e) => setInstructor(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ width: 160 }}>
            <label>上限名額</label>
            <br />
            <input value={seatsLimit} onChange={(e) => setSeatsLimit(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ width: 180 }}>
            <label>狀態</label>
            <br />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: 8 }}>
              <option value="公開">公開</option>
              <option value="草稿">草稿</option>
              <option value="下架">下架</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <label>地點</label>
          <br />
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ marginRight: 8 }}>儲存</button>
          <button type="button" onClick={() => navigate(-1)}>取消</button>
        </div>
      </form>
    </div>
  );
};

export default EventsEdit;
