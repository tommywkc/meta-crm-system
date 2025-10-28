import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const mockCustomers = {
  1: { id: 1, name: '陳小明', phone: '9123-4567', email: 'xiaoming.chen@example.com' },
  2: { id: 2, name: '林美麗', phone: '9876-5432', email: 'meili.lin@example.com' },
  3: { id: 3, name: '張志強', phone: '9120-3344', email: 'zhiqiang.zhang@example.com' }
};

const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = mockCustomers[id] || { id, name: '', phone: '', email: '' };

  return (
    <div style={{ padding: 20 }}>
      <h1>查看客戶</h1>
       <div style={{ marginTop: 20 }}>
        <div><strong>姓名：</strong>{customer.name}</div>
        <div><strong>電話：</strong>{customer.phone}</div>
        <div><strong>Email：</strong>{customer.email}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button style={{ marginRight: 8 }} onClick={() => navigate('/customers')}>返回列表</button>
        <button onClick={() => navigate(`/customers/${customer.id}/edit`)}>編輯</button>
      </div>
    </div>
  );
};

export default CustomerView;
