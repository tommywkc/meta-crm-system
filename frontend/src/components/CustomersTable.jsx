import React from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';

const CustomersTable = ({ customers = [], role, onEdit, onView, onDelete, renderActions, showAdminActions = true, extraColumns = [], sortBy, sortOrder, onSort }) => {
  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) return <span style={{ color: '#ccc', marginLeft: 4 }}>↕</span>;
    return sortOrder === 'asc' ? <span style={{ marginLeft: 4 }}>↑</span> : <span style={{ marginLeft: 4 }}>↓</span>;
  };

  const headers = [
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('user_id')}>用戶編號 {renderSortIcon('user_id')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('name')}>姓名 {renderSortIcon('name')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('role')}>角色 {renderSortIcon('role')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('mobile')}>電話 {renderSortIcon('mobile')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('email')}>電子郵件 {renderSortIcon('email')}</span>,
    ...extraColumns.map(col => col.header),
    '操作'
  ];

  const renderCard = (c, index) => (
    <MobileCard
      key={`card-${c.id || index}`}
      actions={
        <>
            {onView && <button onClick={() => onView(c.user_id)}>詳情</button>}
            {role === 'ADMIN' && showAdminActions && (
              <>
                {onEdit && (
                  <button onClick={() => onEdit(c.user_id)}>
                    編輯
                  </button>
                )}
                {onDelete && (
                  <button className="btn-danger" onClick={() => onDelete(c.user_id)}>
                    刪除
                  </button>
                )}
              </>
            )}
            {renderActions && renderActions(c)}
        </>
      }
     >
       <MobileCardRow label="用戶編號" value={c.user_id} />
       <MobileCardRow label="姓名" value={c.name} />
       <MobileCardRow label="角色" value={c.role} />
       <MobileCardRow label="電話" value={c.mobile} />
       <MobileCardRow label="電子郵件" valueStyle={{ wordBreak: 'break-all' }}>
          {c.email || '無'}
       </MobileCardRow>
       
       {extraColumns.map((col, idx) => (
          <MobileCardRow key={`extra-card-${c.id || index}-${idx}`} label={col.header}>
             {col.render ? col.render(c) : ''}
          </MobileCardRow>
       ))}
    </MobileCard>
  );

  return (
    <CommonTable headers={headers} data={customers} emptyMessage="暫無客戶資料" renderCard={renderCard}>
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
