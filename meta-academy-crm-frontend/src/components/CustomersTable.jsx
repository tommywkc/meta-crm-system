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
          <th style={thTdStyle}>姓名</th>
          <th style={thTdStyle}>電話</th>
          <th style={thTdStyle}>Email</th>
          <th style={thTdStyle}>操作</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td style={thTdStyle}>{c.name}</td>
            <td style={thTdStyle}>{c.phone}</td>
            <td style={thTdStyle}>{c.email}</td>
            <td style={thTdStyle}>
              {/* Admin: 編輯 + 查看, Sales: 查看 only */}
              {role === 'admin' && (
                <>
                  <button style={{ marginRight: 8 }} onClick={() => onEdit && onEdit(c)}>
                    編輯
                  </button>
                </>
              )}
              <button onClick={() => onView && onView(c)}>查看</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomersTable;
