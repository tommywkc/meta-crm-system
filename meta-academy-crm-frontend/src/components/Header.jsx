import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Do not render header when no user
  if (!user) return null;

  const rolePages = {
    member: ['A', 'B'],
    sales: ['B'],
    admin: ['A', 'B', 'C']
  };

  const pages = rolePages[user.role] || ['A', 'B'];

  const go = (page) => {
    if (page === 'A') navigate('/a');
    else if (page === 'B') navigate('/b');
    else if (page === 'C') navigate('/c');
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', marginRight: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>Meta Academy</div>
      </div>

      <nav style={{ display: 'flex', gap: 8 }}>
        {pages.includes('A') && (
          <button onClick={() => go('A')}>A 頁</button>
        )}
        {pages.includes('B') && (
          <button onClick={() => go('B')}>B 頁</button>
        )}
        {pages.includes('C') && (
          <button onClick={() => go('C')}>C 頁</button>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>Hi, {user.username}</div>
        <button onClick={async () => { await logout(); navigate('/login'); }}>登出</button>
      </div>
    </header>
  );
};

export default Header;
