import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const mockCustomers = {
  1: { id: 1, name: '陳小明', phone: '9123-4567', email: 'xiaoming.chen@example.com' },
  2: { id: 2, name: '林美麗', phone: '9876-5432', email: 'meili.lin@example.com' },
  3: { id: 3, name: '張志強', phone: '9120-3344', email: 'zhiqiang.zhang@example.com' }
};

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = mockCustomers[id] || { id, name: '', phone: '', email: '' };

  const [name, setName] = useState(c.name);
  const [phone, setPhone] = useState(c.phone);
  const [email, setEmail] = useState(c.email);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log the values and navigate back
    console.log('Save customer (mock):', { id, name, phone, email });
    alert('已模擬儲存（不會真的送出）');
    navigate('/customers');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>編輯客戶(Admin)</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 600 }}>
        <div style={{ marginBottom: 8 }}>
          <label>姓名</label>
          <br />
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>電話</label>
          <br />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ marginRight: 8 }}>儲存</button>
          <button type="button" onClick={() => navigate(-1)}>取消</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerEdit;
