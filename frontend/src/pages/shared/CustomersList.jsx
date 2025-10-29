import React from 'react';
import CustomersTable from '../../components/CustomersTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const mockCustomers = [
  { id: 1, name: 'John Chen', phone: '9123-4567', email: 'xiaoming.chen@example.com' },
  { id: 2, name: 'Mary Lin', phone: '9876-5432', email: 'meili.lin@example.com' },
  { id: 3, name: 'David Zhang', phone: '9120-3344', email: 'zhiqiang.zhang@example.com' }
];

const CustomersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const authRole = (user && user.role) ? user.role : 'member';

  const handleEdit = (c) => {
    // admin edit route
    navigate(`/customers/${c.id}/edit`);
  };

  const handleView = (c) => {
    navigate(`/customers/${c.id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Customer List (Admin/Sales)</h1>
      <p>Manage customer data and operations (shared by Admin and Sales).</p>

      <CustomersTable customers={mockCustomers} role={authRole} onEdit={handleEdit} onView={handleView} />
    </div>
  );
};

export default CustomersList;
