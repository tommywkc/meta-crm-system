import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const mockCustomers = {
  1: { id: 1, name: 'John Chen', phone: '9123-4567', email: 'xiaoming.chen@example.com' },
  2: { id: 2, name: 'Mary Lin', phone: '9876-5432', email: 'meili.lin@example.com' },
  3: { id: 3, name: 'David Zhang', phone: '9120-3344', email: 'zhiqiang.zhang@example.com' }
};

const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = mockCustomers[id] || { id, name: '', phone: '', email: '' };

  return (
    <div style={{ padding: 20 }}>
      <h1>View Customer</h1>
       <div style={{ marginTop: 20 }}>
        <div><strong>Name:</strong> {customer.name}</div>
        <div><strong>Phone:</strong> {customer.phone}</div>
        <div><strong>Email:</strong> {customer.email}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button style={{ marginRight: 8 }} onClick={() => navigate('/customers')}>Back to List</button>
        <button onClick={() => navigate(`/customers/${customer.id}/edit`)}>Edit</button>
      </div>
    </div>
  );
};

export default CustomerView;
