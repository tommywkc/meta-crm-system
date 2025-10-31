import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById } from '../../api/customersListAPI';



const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetById(id);
      setCustomer(data.customer || {});
    };
    fetchData();
  }, [id]);

  return (
    <div style={{ padding: 20 }}>
      <h1>View Customer</h1>
       <div style={{ marginTop: 20 }}>
        <div><strong>User ID:</strong> {customer.user_id}</div>
        <div><strong>Password:</strong> {customer.password}</div>
        <div><strong>Name:</strong> {customer.name}</div>
        <div><strong>Mobile Number:</strong> {customer.mobile}</div>
        <div><strong>Email:</strong> {customer.email || 'N/A'}</div>
        <div><strong>Role:</strong> {customer.role}</div>
        <div><strong>Source:</strong> {customer.source || 'N/A'}</div>
        <div><strong>Owner Sales ID:</strong> {customer.owner_sales || 'N/A'}</div>
        <div><strong>Team:</strong> {customer.team || 'N/A'}</div>
        <div><strong>Tags:</strong> {customer.tags || 'N/A'}</div>
        <div><strong>Special Notes:</strong> {customer.note_special || 'N/A'}</div>
        <div><strong>QR Token:</strong> {customer.qr_token || 'N/A'}</div>
        <div><strong>Created At:</strong> {customer.create_time}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button style={{ marginRight: 8 }} onClick={() => navigate('/customers')}>Back to List</button>
        <button onClick={() => navigate(`/customers/${id}/edit`)}>Edit</button>
      </div>
    </div>
  );
};

export default CustomerView;
