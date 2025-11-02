import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Do not render header when no user
  if (!user) return null;

  // Define all possible pages with path and label
  const pagesMap = {
    customers: { path: '/customers', label: '客戶名單' },
    approvals: { path: '/approvals', label: '批核頁' },
    scan: { path: '/scan', label: '掃碼簽到' },
    events: { path: '/events', label: '講座與課堂名單' },
    download: { path: '/download', label: '下載名單' },
    reports: { path: '/reports', label: '報表中心' },
    waiting: { path: '/waiting', label: '等待清單' },
    files: { path: '/files', label: '檔案/訂閱管理' },
    notifications: { path: '/notifications', label: '通知中心' },

    sales_kpi: { path: '/sales-kpi', label: '團隊&個人 KPI' },

    payments: { path: '/payments', label: '付款/欠款' },
    receipts: { path: '/receipts', label: '查看收據/證書' },
    requests: { path: '/requests', label: '覆課/補堂/請假申請' },
    homework: { path: '/homework', label: '交功課' },
    myqrcode: { path: '/myqrcode', label: '我的QR code' }
  };

  // Which pages each role should see (order matters)
  const rolePages = {
    // new admin order requested by user
    admin: ['customers','events','approvals','waiting','download','scan','reports','files','notifications'],
    sales: ['customers','events','sales_kpi','notifications'],
    leader: ['customers','events','sales_kpi','notifications'], // LEADER 角色與 sales 相同權限
    member: ['events','payments','receipts','requests','homework','notifications','myqrcode']
  };

  const pages = rolePages[user.role?.toLowerCase()] || [];

  const go = (key) => {
    const p = pagesMap[key];
    if (p) navigate(p.path);
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            // Navigate to role-specific main page (admin/sales/member).
            // Fallback to '/' if role is unexpected.
            const home = user && user.role ? `/${user.role}` : '/';
            navigate(home);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', marginRight: 12 }}>
            <img 
              src="https://static.wixstatic.com/media/cbad7d_a495eabce8704cf8b28b817764226baf~mv2.png/v1/fill/w_154,h_154,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240416093210.png" 
              alt="Meta Academy Logo" 
              style={{ width: 40, height: 40, marginRight: 8 }}
            />
            Meta Academy
          </div>
          {/* page title next to company name */}
          <div>
            {(() => {
              const { pathname } = location;
              const map = {
                '/customers': 'Customers',
                '/approvals': 'Approvals',
                '/scan': 'QR Check-in',
                '/events': 'Create/Edit Events',
                '/download': 'Download Lists',
                '/reports': 'Reports Center',
                
                '/waiting': 'Waiting List',
                '/files': 'Files/Subscription Management',
                '/notifications': 'Notification Center',

                '/sales-kpi': 'Team & Personal KPI',
                '/sales-customers': 'Customers',

                '/payments': 'Payments/Outstanding',
                '/receipts': 'View Receipts/Certificates',
                '/requests': 'Makeup/Reschedule/Leave Requests',
                '/homework': 'Submit Homework',
                '/myqrcode': 'My QR Code',

                '/member': 'Member Page',
                '/sales': 'Sales Page',
                '/admin': 'Admin Page',
                '/login': 'Login'
              };

              // match exact or startsWith for routes with params
              let title = map[pathname];
              if (!title) {
                // fallback: try startsWith
                for (const key of Object.keys(map)) {
                  if (pathname.startsWith(key)) {
                    title = map[key];
                    break;
                  }
                }
              }
              return title ? <h1 style={{ fontSize: 18, margin: 0 }}>{title}</h1> : null;
            })()}
          </div>
        </div>
      </div>

  <nav style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'nowrap' }}>
        {pages.length === 0 ? (
          <div style={{ color: '#666' }}>
            (No buttons configured for this role)
            <div style={{ fontSize: 12, marginTop: 8, maxWidth: 420 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify({ role: user.role, user }, null, 2)}</pre>
            </div>
          </div>
        ) : (
          pages.map((key) => (
            <button key={key} onClick={() => go(key)}>{pagesMap[key].label}</button>
          ))
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>Hi, {user.name}</div>
        <button onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
