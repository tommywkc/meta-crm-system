import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { redirect, useNavigate } from 'react-router-dom';
import { handleLogin } from '../../api/loginAPI';

const LoginPage = () => {
  console.log('LoginPage rendered'); // confirm component loaded
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();


  return (
    <div style={{ padding: '20px' }}>
      <h2>Meta Academy CRM System 登入</h2>
      <div>
        <div>
          <label>用戶編號: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e, { username, password, navigate, setError, authLogin }); }}
          />
        </div>
        <div>
          <label>密碼: </label>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ margin: '5px' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e, { username, password, navigate, setError, authLogin }); }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '隱藏密碼' : '顯示密碼'}
            </button>
          </div>
        </div>
        {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
        <button
          onClick={() => {
            console.log('Button clicked');
            console.log('Credentials:', { username, password });
            handleLogin(null, { username, password, navigate, setError, authLogin });
          }}
          style={{ margin: '5px' }}
          disabled={!username.trim() || !password}
        >
          Login
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <small>Test accounts: 50000/password [admin], 50001/password [sales], 50002/password [leader], 50003/password [member]</small>
      </div>
    </div>
  );
};

export default LoginPage;