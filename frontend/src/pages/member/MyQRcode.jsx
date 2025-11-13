import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../api/userProfileAPI';

const MyQRcode = () => {
  const { user } = useAuth();
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 呼叫後端 API 取得用戶資料（包含 qr_token）
        const data = await getUserProfile();
        
        if (data.user && data.user.qr_token) {
          setQrToken(data.user.qr_token);
        } else {
          setError('您還沒有 QR Code，請聯絡管理員生成。');
        }
      } catch (err) {
        console.error('取得用戶資料失敗:', err);
        setError(err.message || '無法載入 QR Code');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h1>我的 QR Code</h1>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1>我的 QR Code</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>我的 QR Code</h1>
      {qrToken ? (
        <div style={{ marginTop: 20 }}>
          <QRCodeCanvas value={qrToken} size={256} />
          <div style={{ marginTop: 16 }}>
            <strong>User ID:</strong> {user?.id || user?.user_id}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            請在活動簽到時出示此 QR Code
          </div>
        </div>
      ) : (
        <p>無法顯示 QR Code</p>
      )}
    </div>
  );
};

export default MyQRcode;