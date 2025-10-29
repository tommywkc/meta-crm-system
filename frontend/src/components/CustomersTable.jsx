import React from 'react';

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 12
};

const thTdStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left'
};

const CustomersTable = ({ customers = [], role = 'member', onEdit, onView }) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>Name</th>
          <th style={thTdStyle}>Phone</th>
          <th style={thTdStyle}>Email</th>
          <th style={thTdStyle}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td style={thTdStyle}>{c.name}</td>
            <td style={thTdStyle}>{c.phone}</td>
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
