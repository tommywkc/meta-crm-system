import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const MyQRcode = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <PageContainer>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.title}>個人資料</h2>
            <p style={{ textAlign: 'center', color: '#666' }}>請先登入...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>個人資料</h2>
          
          {user.qr_token ? (
            <div style={styles.qrSection}>
              <div style={styles.qrWrapper}>
                <QRCodeCanvas value={user.qr_token} size={200} level={"H"} />
              </div>
              <p style={styles.qrHint}>請在活動簽到時出示此 QR Code</p>
            </div>
          ) : (
            <p style={{ ...styles.qrHint, color: 'red' }}>您還沒有 QR Code，請聯絡管理員。</p>
          )}

          <div style={styles.divider}></div>

          <div style={styles.infoSection}>
            <InfoItem label="姓名" value={user.name} />
            <InfoItem label="電話號碼" value={user.mobile} />
            <InfoItem label="電子郵件" value={user.email || '無'} />
            <InfoItem label="用戶編號" value={user.id} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

const InfoItem = ({ label, value, color, fontSize }) => (
  <div style={styles.infoItem}>
    <span style={styles.label}>{label}</span>
    <span style={{ ...styles.value, color: color || '#333', fontSize: fontSize || '16px' }}>{value}</span>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 'calc(100vh - 140px)', // adjust for header/padding
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #ccc',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '400px', // Limit width for minimalist desktop view
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '22px',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px',
    width: '100%',
  },
  qrWrapper: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #ccc',
  },
  qrHint: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    height: '1px',
    backgroundColor: '#ccc',
    width: '100%',
    marginBottom: '24px',
  },
  infoSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '12px',
  },
  label: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontWeight: '500',
    textAlign: 'right',
    wordBreak: 'break-word',
    maxWidth: '60%',
    color: '#333',
  }
};

export default MyQRcode;