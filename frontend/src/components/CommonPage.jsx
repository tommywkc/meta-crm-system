import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PageContainer = ({ children }) => (
  <div style={{ padding: '20px' }}>
    {children}
  </div>
);

export const PageHeader = ({ title, showBack, onBack, extra }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));
  
  if (showBack) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button className="btn-secondary" onClick={handleBack} style={{ margin: 0 }}>返回</button>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
    </div>
  );
};
