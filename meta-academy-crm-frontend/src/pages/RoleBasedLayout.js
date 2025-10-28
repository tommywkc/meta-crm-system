// src/components/Layout/RoleBasedLayout.js
import React from 'react';
import { useLocation } from 'react-router-dom';

const RoleBasedLayout = ({ children, userRole = 'member' }) => {
  const location = useLocation();
  
  // 根據文檔3的2節「角色與權限」顯示不同導航
  const navigationConfig = {
    member: [
      { path: '/member/calendar', label: '📅 我的日曆', icon: 'calendar' },
      { path: '/member/payments', label: '💳 付款狀態', icon: 'payment' },
      { path: '/member/seminars', label: '🎫 講座報名', icon: 'seminar' }
    ],
    admin: [
      // 管理員導航項目...
    ]
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">Meta Academy CRM</div>
        <nav className="role-navigation">
          {navigationConfig[userRole]?.map(item => (
            <a 
              key={item.path}
              href={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};