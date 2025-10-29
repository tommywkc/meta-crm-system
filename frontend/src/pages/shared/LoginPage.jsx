import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    if (!username.trim() || !password) return setError('Please enter username and password');
    try {
      const user = await login(username.trim(), password);
      if (user.role === 'member') navigate('/member');
      else if (user.role === 'sales') navigate('/sales');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (e) {
      setError(e.message || 'Login failed');
    }
  };

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
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
        </div>
        <div>
          <label>Password: </label>
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
          Login
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <small>Test accounts: member/password, sales/password, admin/adminpass</small>
      </div>
    </div>
  );
};

export default LoginPage;