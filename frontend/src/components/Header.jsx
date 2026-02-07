import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BannerSection from './BannerSection';
import '../App.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = React.useRef(null);

  const scrollNav = (direction) => {
    if (navRef.current) {
      const scrollAmount = 150;
      navRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Do not render header on login page
  if (location.pathname === '/login') return null;

  // Do not render header when no user
  if (!user) return null;

  // Show Banner only on main dashboard pages
  const showBanner = ['/admin', '/sales', '/member', '/leader'].includes(location.pathname);

  // Define all possible pages with path and label
  const pagesMap = {
    customers: { path: '/customers', label: '客戶名單' },
    scan: { path: '/scan', label: '掃碼簽到' },
    events: { path: '/events', label: '講座與課堂名單' },
    reports: { path: '/reports', label: '報表中心' },
    waiting: { path: '/waiting', label: '等待清單' },
    notifications: { path: '/notifications', label: '通知中心' },
    requests_admin: { path: '/admin/requests', label: '申請列表' },

    sales_kpi: { path: '/sales-kpi', label: '團隊&個人 KPI' },

    payments: { path: '/payments', label: '付款/欠款' },
    receipts: { path: '/receipts', label: '查看收據/證書' },
    requests: { path: '/requests/select', label: '覆課/補堂/請假申請' },
    myqrcode: { path: '/myqrcode', label: '我的資料' },
    mycalendar: { path: '/mycalendar', label: '我的日曆' },
    myevents: { path: '/myevents', label: '我的活動' },
    feedback: { path: '/feedback', label: '意見回饋' }
  };

  // Which pages each role should see (order matters)
  const rolePages = {
    // new admin order requested by user
    admin: ['customers','events','payments','requests_admin','scan','waiting','reports','notifications','feedback'],
    sales: ['customers','events','payments','requests','sales_kpi','notifications','feedback'],
    leader: ['customers','events','payments','requests','sales_kpi','notifications','feedback'], // LEADER 角色與 sales 相同權限
    member: ['mycalendar','myevents','events','payments','receipts','requests','notifications','myqrcode','feedback']
  };
  
  const pages = rolePages[user.role?.toLowerCase()] || [];


  const go = (key) => {
    const p = pagesMap[key];
    if (p) navigate(p.path);
  };
  

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px', 
        borderBottom: '1px solid #d0d0d0', 
        background: '#fff',
        width: '100%',
        boxSizing: 'border-box',
        height: '60px'
      }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            // Navigate to role-specific main page (admin/sales/member).
            // Fallback to '/' if role is unexpected.
            if (!user || !user.role) {
              navigate('/');
              return;
            }
            let r = user.role.toLowerCase();
            // leader maps to /sales as per App.js route config
            if (r === 'leader') r = 'sales';
            navigate(`/${r}`);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', marginRight: 12, fontSize: '18px', color: '#333' }}>
            <img
              src={process.env.PUBLIC_URL + '/logo.png'}
              alt="Meta CRM Logo"
              style={{ width: 36, height: 36, marginRight: 8 }}
            />
            Meta Academy
          </div>
        </div>
      </div>

  {/* Navigation Wrapper with Arrows */}
  <div className="header-nav-wrapper">
    <button className="nav-scroll-btn" onClick={() => scrollNav('left')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    
    <nav className="header-nav" ref={navRef}>
        {pages.length === 0 ? (
          <div style={{ color: '#666', alignSelf: 'center' }}>
            (此角色未配置任何按鈕)
            <div style={{ fontSize: 12, marginTop: 8, maxWidth: 420 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify({ role: user.role, user }, null, 2)}</pre>
            </div>
          </div>
        ) : (
          pages.filter(key => !['notifications', 'feedback', 'myqrcode'].includes(key)).map((key) => {
            const path = pagesMap[key].path;
            const isActive = location.pathname.startsWith(path) || (key === 'requests' && location.pathname.startsWith('/requests'));
            return (
              <div 
                key={key} 
                onClick={() => go(key)}
                style={{
                  padding: '0 16px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #093e73' : '3px solid transparent',
                  color: isActive ? '#093e73' : '#666',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.color = '#093e73'; }}
                onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.color = '#666'; }}
              >
                {pagesMap[key].label}
              </div>
            );
          })
        )}
      </nav>

    <button className="nav-scroll-btn" onClick={() => scrollNav('right')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid #eee', marginLeft: 'auto', height: '60%' }}>
        {pages.includes('feedback') && (
          <div 
            onClick={() => navigate('/feedback')}
            style={{ 
              cursor: 'pointer', 
              color: location.pathname.startsWith('/feedback') ? '#093e73' : '#666',
              display: 'flex', 
              alignItems: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background 0.2s',
              marginRight: -4 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="意見回饋"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
        )}
        {pages.includes('notifications') && (
          <div 
            onClick={() => navigate('/notifications')}
            style={{ 
              cursor: 'pointer', 
              color: location.pathname.startsWith('/notifications') ? '#093e73' : '#666',
              display: 'flex', 
              alignItems: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="通知中心"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
        )}
        
        {/* User Identity Section */}
        {pages.includes('myqrcode') && (
          <div 
            onClick={() => navigate('/myqrcode')}
            style={{ 
              cursor: 'pointer', 
              color: location.pathname.startsWith('/myqrcode') ? '#093e73' : '#666',
              display: 'flex', 
              alignItems: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background 0.2s',
              marginRight: -8 // Pull user name closer
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="我的資料"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}
        <div style={{ fontSize: 14 }}>Hi, {user.name}</div>
        <button 
          onClick={async () => { await logout(); navigate('/login'); }}
          style={{
            padding: '4px 12px',
            border: 'none',
            borderRadius: '4px',
            background: '#093e73',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          登出
        </button>
      </div>
    </header>

      {showBanner && (
        <div style={{ background: '#fff' }}>
            <BannerSection />
        </div>
      )}
    </div>
  );
};

export default Header;
