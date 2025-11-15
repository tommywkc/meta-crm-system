import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';

const MyQRcode = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h1>我的 QR Code</h1>
        <p>請先登入...</p>
      </div>
    );
  }

  if (!user.qr_token) {
    return (
      <div style={{ padding: 20 }}>
        <h1>我的 QR Code</h1>
        <p style={{ color: 'red' }}>您還沒有 QR Code，請聯絡管理員生成。</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>我的 QR Code</h1>
      <div style={{ marginTop: 20 }}>
        <QRCodeCanvas value={user.qr_token} size={256} />
        <div style={{ marginTop: 8, fontSize: 16, color: '#666' }}>
          QR Token: {user?.qr_token}
        </div>
        <div style={{ marginTop: 8, fontSize: 12}}>
          請在活動簽到時出示此 QR Code
        </div>
        <div style={{ marginTop: 8, fontSize: 12}}>
          ===========================
        </div>
        <div style={{ marginTop: 16 }}>
          <strong>用戶編號:</strong> {user?.id}
        </div>
        <div style={{ marginTop: 16 }}>
          <strong>姓名:</strong> {user?.name}
        </div>
        <div style={{ marginTop: 16 }}>
          <strong>電子郵件:</strong> {user?.username || user?.email}
        </div>
      </div>
    </div>
  );
};

export default MyQRcode;