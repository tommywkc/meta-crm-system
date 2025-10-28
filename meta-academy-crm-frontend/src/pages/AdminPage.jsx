import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1>管理員頁面</h1>
      <p>歡迎，{user?.username}</p>
      <div>
        <p>這裡是管理員專用內容</p>
        <button onClick={logout}>登出</button>
      </div>
    </div>
  );
};

export default AdminPage;