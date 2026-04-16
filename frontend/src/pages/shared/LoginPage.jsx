import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { handleLogin } from '../../api/loginAPI';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    handleLogin(null, { username, password, navigate, setError, authLogin });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Logo Section */}
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={process.env.PUBLIC_URL + '/logo.png'}
            alt="Meta Academy"
            style={{ height: '180px', objectFit: 'contain' }}
          />
          <span style={{ marginTop: '16px', fontSize: '24px', fontWeight: 'bold', color: '#093e73' }}>Meta Academy</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', padding: '0 20px' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>用戶編號</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="輸入用戶編號"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '40px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>密碼</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼"
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px', // space for eye icon
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
               <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.5
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {/* Simple Eye Icon SVG */}
                {showPassword ? (
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                     <line x1="1" y1="1" x2="23" y2="23"></line>
                   </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#e74c3c', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

          <button
            type="submit"
            disabled={!username.trim() || !password}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (!username.trim() || !password) ? '#aab7c4' : '#093e73',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontSize: '16px',
              cursor: (!username.trim() || !password) ? 'default' : 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            登入
          </button>
        </form>

        <div style={{ marginTop: '20px', color: '#999', fontSize: '12px' }}>
          <small>Test accounts: 50000/password [admin], 50001/password [sales], 50002/password [leader], 50003/password [member], 50005/password [member]</small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;