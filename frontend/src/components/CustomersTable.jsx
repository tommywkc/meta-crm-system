import React from 'react';
import { tableStyle, thTdStyle, redTextStyle } from '../styles/TableStyles';

const CustomersTable = ({ customers = [], role, onEdit, onView, onDelete }) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>User ID</th>
          <th style={thTdStyle}>Name</th>
          <th style={thTdStyle}>Role</th>
          <th style={thTdStyle}>Phone</th>
          <th style={thTdStyle}>Email</th>
          <th style={thTdStyle}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td style={thTdStyle}>{c.user_id}</td>
            <td style={thTdStyle}>{c.name}</td>
            <td style={thTdStyle}>{c.role}</td>
            <td style={thTdStyle}>{c.mobile}</td>
            <td style={thTdStyle}>{c.email ? c.email : 'N/A'}</td>
            <td style={thTdStyle}>
              <button onClick={() => onView && onView(c.user_id)}>Details</button>
              {role === 'ADMIN' && (
                <>
                  <button style={{ marginLeft: 8 }} onClick={() => onEdit && onEdit(c.user_id)}>
                    Edit
                  </button>
                  <button style={{ ...redTextStyle, marginLeft: 8 }} onClick={() => onDelete && onDelete(c.user_id)}>
                    Delete
                  </button>
                </>
                
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomersTable;
