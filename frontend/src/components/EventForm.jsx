import React, { useState, useEffect } from 'react';

const EventForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  submitButtonText = "提交",
  title = "事件表單" 
}) => {
  const [name, setName] = useState(initialData.name || '');
  const [category, setCategory] = useState(initialData.category || '');
  const [schedule, setSchedule] = useState(initialData.schedule || '');
  const [seatsLimit, setSeatsLimit] = useState(initialData.seatsLimit || '');
  const [status, setStatus] = useState(initialData.status || '草稿');
  const [instructor, setInstructor] = useState(initialData.instructor || '');
  const [location, setLocation] = useState(initialData.location || '');

  // 當 initialData 變化時更新表單狀態
  useEffect(() => {
    setName(initialData.name || '');
    setCategory(initialData.category || '');
    setSchedule(initialData.schedule || '');
    setSeatsLimit(initialData.seatsLimit || '');
    setStatus(initialData.status || '草稿');
    setInstructor(initialData.instructor || '');
    setLocation(initialData.location || '');
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name,
      category,
      schedule,
      seatsLimit,
      status,
      instructor,
      location
    };
    onSubmit(formData);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{title}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
        <div style={{ marginBottom: 8 }}>
          <label>名稱</label>
          <br />
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>類別</label>
          <br />
          <input 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
            placeholder="例如：課堂 / 講座"
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>場次/時間（YYYY-MM-DD HH:mm）</label>
          <br />
          <input 
            value={schedule} 
            onChange={(e) => setSchedule(e.target.value)} 
            style={{ width: '100%', padding: 8 }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>講師</label>
            <br />
            <input 
              value={instructor} 
              onChange={(e) => setInstructor(e.target.value)} 
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ width: 160 }}>
            <label>上限名額</label>
            <br />
            <input 
              value={seatsLimit} 
              onChange={(e) => setSeatsLimit(e.target.value)} 
              style={{ width: '100%', padding: 8 }}
              type="number"
            />
          </div>
          <div style={{ width: 180 }}>
            <label>狀態</label>
            <br />
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              style={{ width: '100%', padding: 8 }}
            >
              <option value="公開">公開</option>
              <option value="草稿">草稿</option>
              <option value="下架">下架</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <label>地點</label>
          <br />
          <input 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ marginRight: 8 }}>
            {submitButtonText}
          </button>
          <button type="button" onClick={onCancel}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;