import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../api/notificationsAPI';
import BannerSection from './BannerSection';
import '../App.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = React.useRef(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(() => {
    if (user) {
      getUnreadCount().then(res => {
        if (res && typeof res.count === 'number') setUnreadCount(res.count);
      });
    }
  }, [user]);

  React.useEffect(() => {
    fetchUnreadCount(); // Initial fetch
    
    // Poll every 60 seconds for real-time updates
    const intervalId = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(intervalId);
  }, [fetchUnreadCount, location.pathname]); // Re-fetch when changing pages or user changes

  const scrollNav = (direction) => {
    if (navRef.current) {
      const scrollAmount = 150;
      navRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  const menuRef = React.useRef(null);
  const toggleRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle swipe gestures with real-time tracking
  React.useEffect(() => {
    if (!isMobile) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let currentX = 0;
    let isDragging = false;
    let isHorizontalSwipe = false; // Flag to confirm if it's a valid horizontal swipe
    const MENU_WIDTH = 260; // Must match CSS width

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isHorizontalSwipe = false; // Reset flag
      
      // Prevent sidebar swipe if user is interacting with a slider (Banner or StudentWork)
      if (e.target.closest('.slick-slider')) {
        return;
      }
      
      isDragging = true;
      // Note: We do NOT set visibility or transition here yet. 
      // We wait for touchmove to confirm it's a horizontal swipe.
    };

    const handleTouchMove = (e) => {
      if (!isDragging || !menuRef.current) return;
      currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const diffX = currentX - touchStartX;
      const diffY = currentY - touchStartY;

      // Check if we have determined direction yet
      if (!isHorizontalSwipe) {
        // If moved less than 10px, treat as tap/noise, do nothing yet
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) return;

        // If vertical movement is dominant, it's a scroll. Cancel custom swipe.
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isDragging = false;
          return;
        }

        // Otherwise, it's a horizontal swipe. Start moving the menu.
        isHorizontalSwipe = true;
        menuRef.current.style.transition = 'none'; // Disable transition for 1:1 movement
        if (!menuOpen) menuRef.current.style.visibility = 'visible';
      }

      // Prevent default scrolling only if we are horizontally swiping
      // e.preventDefault(); // Optional: might block scrolling if not careful. 
      // Usually better not to preventDefault on document level listeners unless passive: false is set.

      let newTranslateX;
      
      if (menuOpen) {
        // Dragging to close (diffX should be negative)
        newTranslateX = Math.min(0, Math.max(-MENU_WIDTH, diffX));
      } else {
        // Dragging to open (diffX should be positive)
        newTranslateX = Math.min(0, Math.max(-MENU_WIDTH, -MENU_WIDTH + diffX));
      }
      
      menuRef.current.style.transform = `translateX(${newTranslateX}px)`;
    };

    const handleTouchEnd = (e) => {
      if (!isDragging || !menuRef.current) return;
      isDragging = false;
      
      // If we never confirmed it was a horizontal swipe (e.g. just a tap or vertical scroll), do nothing
      if (!isHorizontalSwipe) return;

      // Restore transition for snap animation
      menuRef.current.style.transition = 'transform 0.3s ease, visibility 0s linear 0s';
      
      currentX = e.changedTouches[0].clientX;
      const diff = currentX - touchStartX;
      const threshold = MENU_WIDTH * 0.3; // 30% width threshold
      // 僅當拉動超過 threshold 才開啟，否則一律收回
      if (!menuOpen) {
        if (diff > threshold) {
          setMenuOpen(true);
          setTimeout(() => {
            const backdrop = document.querySelector('[style*="rgba(0,0,0,0.5)"]');
            if (backdrop) {
              backdrop.style.opacity = 1;
              backdrop.style.pointerEvents = 'auto';
            }
          }, 0);
        } else {
          // 未超過閾值，確保 menu 關閉
          setMenuOpen(false);
          if (menuRef.current) {
            menuRef.current.style.transform = 'translateX(-100%)';
            menuRef.current.style.visibility = 'hidden';
          }
        }
      } else {
        if (diff < -threshold) {
          setMenuOpen(false);
        } else {
          if (menuRef.current) menuRef.current.style.transform = '';
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, menuOpen]);

  // Do not render header on login page
  if (location.pathname === '/login') return null;

  // Do not render header when no user
  if (!user) return null;

  // Normalize role (prevents issues like "ADMIN ")
  const roleKey = user?.role ? user.role.trim().toLowerCase() : '';

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

    admin_kpi: { path: '/admin-kpi', label: 'KPI' },

    sales_kpi: { path: '/sales-kpi', label: '團隊&個人 KPI' },

    payments: { path: '/payments', label: '付款/欠款' },
    receipts: { path: '/receipts', label: '查看收據/證書' },
    requests: { path: '/requests/select', label: '覆課/補堂/請假申請' },
    myqrcode: { path: '/myqrcode', label: '我的資料' },
    myevents: { path: '/myevents', label: '我的活動' },
    feedback: { path: '/feedback', label: '意見回饋' }
  };

  // Which pages each role should see (order matters)
  const rolePages = {
    // new admin order requested by user
    admin: ['customers','events','payments','requests_admin','admin_kpi','reports','scan','notifications','feedback'],
    sales: ['customers','events','payments','requests','sales_kpi','notifications','feedback'],
    leader: ['customers','events','payments','requests','sales_kpi','notifications','feedback'], // LEADER 角色與 sales 相同權限
    member: ['myevents','events','payments','receipts','requests','notifications','myqrcode','feedback']
  };
  
  const pages = rolePages[roleKey] || [];


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
        {isMobile && (
          <div 
            ref={toggleRef}
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ 
              padding: '8px',  
              marginRight: 4, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>
        )}
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            // Navigate to role-specific main page (admin/sales/member).
            // Fallback to '/' if role is unexpected.
            if (!roleKey) {
              navigate('/');
              return;
            }
            let r = roleKey;
            // leader maps to /sales as per App.js route config
            if (r === 'leader') r = 'sales';
            navigate(`/${r}`);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 12, fontSize: '18px', color: '#333' }}>
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
  {!isMobile && (
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
  )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, marginLeft: 'auto', height: '60%' }}>
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
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="通知中心"
            style={{ 
              cursor: 'pointer', 
              color: location.pathname.startsWith('/notifications') ? '#093e73' : '#666',
              display: 'flex', 
              alignItems: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background 0.2s',
              position: 'relative'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: 'red',
                borderRadius: '50%',
                border: '1px solid white'
              }}></span>
            )}
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
        {!isMobile && <div style={{ fontSize: 16 }}>{user.name}</div>}
        {!isMobile && (
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
        )}
      </div>
    </header>

    {/* Mobile Slide-out Menu (Sidebar) */}
    {isMobile && (
      <>
        {/* Simple backdrop overlay to dim content behind */}
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            transition: 'opacity 0.3s ease',
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none'
          }}
          onClick={() => setMenuOpen(false)}
        />
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            bottom: 0,
            width: '260px',
            backgroundColor: '#fff',
            zIndex: 999,
            borderTop: '1px solid #d0d0d0',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s ease, visibility 0s linear 0.3s',
            transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
            visibility: menuOpen ? 'visible' : 'hidden'
          }}
          // Override transition when opening to make visibility immediate
          ref={(node) => {
            menuRef.current = node;
            if (node && menuOpen) {
              node.style.transition = 'transform 0.3s ease, visibility 0s linear 0s';
            } else if (node) {
              node.style.transition = 'transform 0.3s ease, visibility 0s linear 0.3s';
            }
          }}
          >
        {pages.filter(key => !['notifications', 'feedback', 'myqrcode'].includes(key)).map((key) => {
            const p = pagesMap[key];
            const isActive = location.pathname.startsWith(p.path) || (key === 'requests' && location.pathname.startsWith('/requests'));
            return (
              <div
                key={key}
                onClick={() => { setMenuOpen(false); go(key); }}
                style={{
                  padding: '16px 20px',
                  borderBottom: isActive ? '3px solid #093e73' : '1px solid #d0d0d0',
                  color: isActive ? '#093e73' : '#444',
                  fontWeight: isActive ? 'bold' : 'normal',
                  backgroundColor: '#fff',
                  fontSize: '16px'
                }}
              >
                {p.label}
              </div>
            );
        })}
        {/* Mobile Logout */}
        <div
            onClick={async () => { await logout(); navigate('/login'); }}
            style={{
              marginTop: 'auto',
              marginBottom: '60px',
              padding: '16px 20px',
              borderTop: '1px solid #d0d0d0',
              borderBottom: '1px solid #d0d0d0',
              color: '#d32f2f',
              fontSize: '16px'
            }}
        >
          登出
        </div>
      </div>
    </>
    )}

      {showBanner && (
        <div style={{ background: '#fff', lineHeight: 0, fontSize: 0 }}>
            <BannerSection />
        </div>
      )}
    </div>
  );
};

export default Header;
