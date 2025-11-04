import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
// import jwtDecode from 'jwt-decode';

const MyQRcode = () => {
  const [customer, setCustomer] = useState({});

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     const decoded = jwtDecode(token);
  //     setCustomer({ user_id: decoded.userId });
  //   }
  // }, []);

  // return (
  //   <div style={{ padding: 20 }}>
  //     <h1>我的 QR Code</h1>
  //     {customer.qr_token && <QRCodeCanvas value={customer.qr_token} size={200} />}
  //     <div><strong>User ID:</strong> {customer.user_id}</div>
  //   </div>
  // );
};

export default MyQRcode;