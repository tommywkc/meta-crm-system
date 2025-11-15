import React from 'react';
import { tableStyle, thTdStyle, redTextStyle } from '../styles/TableStyles';

const CustomersTable = ({ customers = [], role, onEdit, onView, onDelete }) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>用戶編號</th>
          <th style={thTdStyle}>姓名</th>
          <th style={thTdStyle}>角色</th>
          <th style={thTdStyle}>電話</th>
          <th style={thTdStyle}>電子郵件</th>
          <th style={thTdStyle}>操作</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td style={thTdStyle}>{c.user_id}</td>
            <td style={thTdStyle}>{c.name}</td>
            <td style={thTdStyle}>{c.role}</td>
            <td style={thTdStyle}>{c.mobile}</td>
            <td style={thTdStyle}>{c.email ? c.email : '無'}</td>
            <td style={thTdStyle}>
              <button onClick={() => onView && onView(c.user_id)}>詳情</button>
              {role === 'ADMIN' && (
                <>
                  <button style={{ marginLeft: 8 }} onClick={() => onEdit && onEdit(c.user_id)}>
                    編輯
                  </button>
                  <button style={{ ...redTextStyle, marginLeft: 8 }} onClick={() => onDelete && onDelete(c.user_id)}>
                    刪除
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
