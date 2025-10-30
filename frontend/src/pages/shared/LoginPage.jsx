import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { redirect, useNavigate } from 'react-router-dom';
import { handleLogin } from '../../api/loginAPI';

const LoginPage = () => {
  console.log('LoginPage rendered'); // 確認元件有載入
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  //const { login } = useAuth();
  const navigate = useNavigate();

  // login logic moved to `sendAPI/loginAPI.handleLogin`

  return (
    <div style={{ padding: '20px' }}>
      <h2>Meta Academy CRM System Login</h2>
      <div>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e, { username, password, navigate, setError }); }}
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: '5px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e, { username, password, navigate, setError }); }}
          />
        </div>
        {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
        <button
          onClick={() => {
            console.log('Button clicked');
            console.log('Credentials:', { username, password });
            handleLogin(null, { username, password, navigate, setError });
          }}
          style={{ margin: '5px' }}
          disabled={!username.trim() || !password}
        >
          Login
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <small>Old test accounts: member/password, sales/password, admin/adminpass</small>
        <small>Test accounts: 1/password, 2/password, 3/password, 444/password</small>
      </div>
    </div>
  );
};

export default LoginPage;