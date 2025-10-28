import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('member');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username.trim()) {
      // 設定 user
      login(username, role);
      // 根據角色導向對應頁面
      if (role === 'member') navigate('/member');
      else if (role === 'sales') navigate('/sales');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Meta academy CRM系統登入</h2>
      <div>
        <div>
          <label>用戶名: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
        </div>
        <div>
          <label>角色: </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ margin: '5px' }}
          >
            <option value="member">會員</option>
            <option value="sales">銷售</option>
            <option value="admin">管理員</option>
          </select>
        </div>
        <button
          onClick={handleLogin}
          style={{ margin: '5px' }}
          disabled={!username.trim()}
        >
          登入
        </button>
      </div>
    </div>
  );
};

export default Login;