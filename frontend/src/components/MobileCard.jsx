import React from 'react';

export const MobileCard = ({ children, actions, className = '', onClick }) => {
  return (
    <div 
      className={`mobile-card ${className}`} 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {children}
      {actions && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export const MobileCardRow = ({ label, value, children, style, labelStyle, valueStyle }) => {
  return (
    <div className="mobile-card-row" style={style}>
      <span className="mobile-card-label" style={labelStyle}>{label}</span>
      <span className="mobile-card-value" style={valueStyle}>{children || value}</span>
    </div>
  );
};

export default MobileCard;
