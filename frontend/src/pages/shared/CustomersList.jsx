import React, { useState, useEffect } from 'react';
import CustomersTable from '../../components/CustomersTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleList } from '../../api/customersListAPI';
import {UpperSelectContainerStyle, LowerSelectContainerStyle} from '../../styles/SelectStyles';

const CustomersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const authRole = (user && user.role) ? user.role : 'member';
  
  console.log('Current user:', user);
  console.log('Current authRole:', authRole);

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const payload = await handleList(100, 0);
      setCustomers(payload.customers || []);
    };
    fetchData();
  }, []);


  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const startIndex = (page - 1) * limit;
  const pagedCustomers = customers.slice(startIndex, startIndex + limit);

  const handleEdit = (c) => navigate(`/customers/${c.id}/edit`);
  const handleView = (user_id) => navigate(`/customers/${user_id}`);

  return (
    <div style={{ padding: 20 }}>
      <h1>Member List</h1>
      <p>Manage member data and operations (shared by Admin and Sales).</p>

      {authRole === 'ADMIN' && (
        <button onClick={() => navigate('/customers/create')}>
          Create User
        </button>
      )}

      <input type="text" placeholder="search..." />

      <div
        style={ UpperSelectContainerStyle }
      >
        <label>
          Page:&nbsp;
          <select value={page} onChange={(e) => setPage(Number(e.target.value))}>
            {Array.from({ length: Math.max(1, Math.ceil(customers.length / limit)) }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </label>

        <label>
          Items per page:&nbsp;
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      {/* 📋 客戶清單表格 */}
      <CustomersTable
        customers={pagedCustomers}
        role={authRole}
        onEdit={handleEdit}
        onView={handleView}
      />

      <div
        style={ LowerSelectContainerStyle }
      >
        <label>
          Page:&nbsp;
          <select value={page} onChange={(e) => setPage(Number(e.target.value))}>
            {Array.from({ length: Math.max(1, Math.ceil(customers.length / limit)) }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default CustomersList;