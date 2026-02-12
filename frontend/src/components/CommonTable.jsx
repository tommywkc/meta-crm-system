import React from 'react';
import '../App.css';

/**
 * A reusable table component that follows the "Upcoming 5 Lessons" style.
 * 
 * Props:
 * - headers: Array of strings or React nodes for <th>
 * - children: The <tbody> content (rows)
 * - className: Optional extra classes
 */
const CommonTable = ({ headers = [], children, className = '', data, emptyMessage = '暫無資料', onSort, sortConfig, renderCard }) => {
  const showEmpty = Array.isArray(data) && data.length === 0;

  const handleHeaderClick = (index) => {
    if (typeof onSort === 'function') onSort(index);
  };

  const renderHeader = (h, i) => {
    const isActive = sortConfig && sortConfig.columnIndex === i;
    const dir = isActive ? sortConfig.direction : null;
    return (
      <th key={i} style={{ cursor: onSort ? 'pointer' : 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleHeaderClick(i)}>
          <span>{h}</span>
          {onSort && (
            <span style={{ fontSize: 12, color: isActive ? '#333' : '#bbb' }}>
              {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}
            </span>
          )}
        </div>
      </th>
    );
  };

  const TableContent = (
    <table className={`common-table ${className}`}>
      <thead>
        <tr>
          {headers.map((h, i) => renderHeader(h, i))}
        </tr>
      </thead>
      <tbody>
        {showEmpty ? (
          <tr>
            <td colSpan={headers.length} style={{ textAlign: 'center', padding: '10px' }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  );

  if (renderCard) {
    return (
      <>
        <div className="common-table-desktop">
          {TableContent}
        </div>
        <div className="common-table-mobile">
          {showEmpty ? (
             <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>{emptyMessage}</div>
          ) : (
             data && data.map((item, index) => (
               <React.Fragment key={index}>
                 {renderCard(item, index)}
               </React.Fragment>
             ))
          )}
        </div>
      </>
    );
  }

  return <div style={{ overflowX: 'auto' }}>{TableContent}</div>;
};

export default CommonTable;
