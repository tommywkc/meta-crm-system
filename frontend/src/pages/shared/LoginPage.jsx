import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { redirect, useNavigate } from 'react-router-dom';
import { handleLogin } from '../../api/loginAPI';

const LoginPage = () => {
  console.log('LoginPage rendered'); // 確認元件有載入
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();


  return (
    <div style={{ padding: '20px' }}>
      <h2>Meta Academy CRM System Login</h2>
      <div>
        <div>
          <label>UserID: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e, { username, password, navigate, setError, authLogin }); }}
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e, { username, password, navigate, setError, authLogin }); }}
          />
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
        <small>Test accounts: 50000/password, 50001/password, 50002/password, 50003/password</small>
      </div>
    </div>
  );
};

export default LoginPage;