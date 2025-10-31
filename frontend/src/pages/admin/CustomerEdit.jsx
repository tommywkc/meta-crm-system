import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById, handleUpdateById } from '../../api/customersListAPI';


const CustomerEdit = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault(); // 防止表單重新整理
    try {
      await handleUpdateById(id, customer);
      alert('更新成功');
      navigate('/customers/' + id);
    } catch (error) {
      console.error('更新失敗:', error);
      alert('更新資料失敗，請稍後再試');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Edit User: (Admin)</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 600 }}>
        <div>
          <p><strong>Editing User ID: </strong><br /><u>{customer.user_id}</u></p>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Name:</label>
          <br />
          <input value={customer.name || ''} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password:</label>
          <br />
          <input value={customer.password} onChange={(e) => setCustomer({ ...customer, password: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Mobile:</label>
          <br />
          <input value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Email:</label>
          <br />
          <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Role:</label>
          <br />
          <input value={customer.role} onChange={(e) => setCustomer({ ...customer, role: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Source:</label>
          <br />
          <input value={customer.source} onChange={(e) => setCustomer({ ...customer, source: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Owner Sales:</label>
          <br />
          <input value={customer.owner_sales} onChange={(e) => setCustomer({ ...customer, owner_sales: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Team:</label>
          <br />
          <input value={customer.team} onChange={(e) => setCustomer({ ...customer, team: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Tags:</label>
          <br />
          <input value={customer.tags} onChange={(e) => setCustomer({ ...customer, tags: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Special Notes:</label>
          <br />
          <input value={customer.note_special} onChange={(e) => setCustomer({ ...customer, note_special: e.target.value })} style={{ width: '100%', padding: 2 }} />
        </div>
        <div>
          <p>QR Token: <br /><u>{customer.qr_token}</u></p>
        </div>
        <div>
          <p>Create Time: <br /><u>{customer.create_time}</u></p>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ marginRight: 8 }}>Save</button>
          <button type="button" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerEdit;
