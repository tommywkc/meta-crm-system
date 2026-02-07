import React from 'react';
import CommonTable from './CommonTable';

const CustomersTable = ({ customers = [], role, onEdit, onView, onDelete, renderActions, showAdminActions = true, extraColumns = [] }) => {
  const headers = [
    '用戶編號',
    '姓名',
    '角色',
    '電話',
    '電子郵件',
    ...extraColumns.map(col => col.header),
    '操作'
  ];

  return (
    <CommonTable headers={headers} data={customers} emptyMessage="暫無客戶資料">
      {customers.map((c) => (
        <tr key={c.id}>
          <td>{c.user_id}</td>
          <td>{c.name}</td>
          <td>{c.role}</td>
          <td>{c.mobile}</td>
          <td>{c.email ? c.email : '無'}</td>
          {extraColumns.map((col, idx) => (
            <td key={`extra-cell-${c.id}-${idx}`}>
              {col.render ? col.render(c) : ''}
            </td>
          ))}
          <td>
            <button onClick={() => onView && onView(c.user_id)}>詳情</button>
            {role === 'ADMIN' && showAdminActions && (
              <>
                <button style={{ marginLeft: 8 }} onClick={() => onEdit && onEdit(c.user_id)}>
                  編輯
                </button>
                <button className="btn-danger" style={{ marginLeft: 8 }} onClick={() => onDelete && onDelete(c.user_id)}>
                  刪除
                </button>
              </>
            )}
            {renderActions && (
              <span style={{ marginLeft: 8 }}>
                {renderActions(c)}
              </span>
            )}
          </td>
        </tr>
      ))}
    </CommonTable>
  );
};

export default CustomersTable;
