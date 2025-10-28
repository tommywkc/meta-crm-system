import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    if (!username.trim() || !password) return setError('請輸入使用者與密碼');
    try {
      const user = await login(username.trim(), password);
      // 依 server 回傳的 role 導頁
      if (user.role === 'member') navigate('/member');
      else if (user.role === 'sales') navigate('/sales');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (e) {
      setError(e.message || '登入失敗');
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
          <label>密碼: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
        </div>
        {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
        <button
          onClick={handleLogin}
          style={{ margin: '5px' }}
          disabled={!username.trim() || !password}
        >
          登入
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <small>測試帳號：member/password、sales/password、admin/adminpass</small>
      </div>
    </div>
  );
};

export default Login;