import React, { useState, useEffect } from 'react';
import CustomersTable from '../../components/CustomersTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleList, handleDeleteById } from '../../api/customersListAPI';
import { UpperSelectContainerStyle, LowerSelectContainerStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';

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

  const fetchCustomers = async () => {
    const payload = await handleList(100, 0);
    setCustomers(payload.customers || []);
  };

  const handleDelete = async (user_id) => {
    if (window.confirm('Comfire to remove this User?')) {
      await handleDeleteById(user_id);  // remove from backend
      alert('User deleted successfully');
      await fetchCustomers();            // fetch latest data from backend
    }
  };


  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  const startIndex = (page - 1) * limit;
  const pagedCustomers = customers.slice(startIndex, startIndex + limit);

  const handleEdit = (user_id) => navigate(`/customers/${user_id}/edit`);
  const handleView = (user_id) => navigate(`/customers/${user_id}`);

  const handleSearch = () => {
    console.log('Searching for:', searchTerm);
    // TODO: 實作搜尋邏輯
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>客戶名單</h1>
      

      {authRole === 'ADMIN' && (
        <button onClick={() => navigate('/customers/create')}>
          新增客戶
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
        <input 
          type="text" 
          placeholder="Input [User ID / Name / Mobile / Email] to search..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          style={searchInputStyle}
        />
        <button onClick={handleSearch}>
          Search
        </button>
      </div>

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

  {/* 📋 Customers table */}
      <CustomersTable
        customers={pagedCustomers}
        role={authRole}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
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