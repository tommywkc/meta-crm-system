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
const CommonTable = ({ headers = [], children, className = '' }) => {
  return (
    <table className={`common-table ${className}`}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  );
};

export default CommonTable;
