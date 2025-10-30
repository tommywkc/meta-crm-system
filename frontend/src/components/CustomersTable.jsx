import React from 'react';
import { tableStyle, thTdStyle } from '../styles/TableStyles';

const CustomersTable = ({ customers = [], role = 'member', onEdit, onView }) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>UserID</th>
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
            <td style={thTdStyle}>{c.email}</td>
            <td style={thTdStyle}>
              {role === 'admin' && (
                <>
                  <button style={{ marginRight: 8 }} onClick={() => onEdit && onEdit(c)}>
                    Edit
                  </button>
                </>
              )}
              <button onClick={() => onView && onView(c)}>View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomersTable;
