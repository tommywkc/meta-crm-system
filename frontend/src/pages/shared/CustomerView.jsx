import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById } from '../../api/customersListAPI';
import Calendar from '../../components/Calendar';
import { QRCodeCanvas } from 'qrcode.react';



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

  // Mock calendar events for this customer
  const customerEvents = {
    '2025-11-05': ['課堂: XXXXX'],
    '2025-11-12': ['課堂: XXXX'],
    '2025-11-20': ['課堂: XXX'],
  };

  const isMember = customer.role?.toLowerCase() === 'member';

  return (
    <div style={{ padding: 20 }}>
      <h1>查看客戶</h1>
      
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
  {/* Left: customer information */}
        <div style={{ flex: isMember ? 1 : 'none', maxWidth: isMember ? 'none' : '600px' }}>
          <h2>客戶資訊</h2>
          <div style={{ marginTop: 20 }}>
            <div><strong>用戶 ID:</strong> {customer.user_id}</div>
            <div><strong>密碼:</strong> {customer.password}</div>
            <div><strong>姓名:</strong> {customer.name}</div>
            <div><strong>手機號碼:</strong> {customer.mobile}</div>
            <div><strong>Email:</strong> {customer.email || 'N/A'}</div>
            <div><strong>角色:</strong> {customer.role}</div>
            <div><strong>來源:</strong> {customer.source || 'N/A'}</div>
            <div><strong>負責銷售:</strong> {customer.owner_sales || 'N/A'}</div>
            <div><strong>團隊:</strong> {customer.team || 'N/A'}</div>
            <div><strong>標籤:</strong> {customer.tags || 'N/A'}</div>
            <div><strong>特殊備註:</strong> {customer.note_special || 'N/A'}</div>
            <div><strong>QR Token:</strong> {customer.qr_token || 'N/A'}</div>
            <div style={{ marginTop: 20 }}>
              <strong>QR Code:</strong><br/>
              {customer.qr_token ? (
                <QRCodeCanvas value={customer.qr_token} size={100} />
              ) : (
                <div>N/A</div>
              )}
            </div>
            <div><strong>建立時間:</strong> {customer.create_time}</div>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <button style={{ marginRight: 8 }} onClick={() => navigate('/customers')}>返回列表</button>
            <button onClick={() => navigate(`/customers/${id}/edit`)}>編輯</button>
          </div>
        </div>

  {/* Right: calendar (visible to MEMBER only) */}
        {isMember && (
          <div style={{ flex: 1 }}>
            <h2>會員日曆</h2>
            <Calendar events={customerEvents} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerView;
