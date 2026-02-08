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
const CommonTable = ({ headers = [], children, className = '', data, emptyMessage = '暫無資料', renderCard }) => {
  const showEmpty = Array.isArray(data) && data.length === 0;

  const TableContent = (
    <table className={`common-table ${className}`}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
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
