import React, { useState, useMemo } from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';

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

  const [sortConfig, setSortConfig] = useState(null);
  const handleSort = (col) => setSortConfig((prev) => {
    if (!prev || prev.columnIndex !== col) return { columnIndex: col, direction: 'asc' };
    return { columnIndex: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
  });

  const sorted = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    if (!sortConfig) return customers;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const cp = [...customers];
    cp.sort((a, b) => {
      switch (sortConfig.columnIndex) {
        case 0: return (Number(a.user_id ?? 0) - Number(b.user_id ?? 0)) * dir;
        case 1: return String(a.name ?? '').localeCompare(String(b.name ?? '')) * dir;
        case 2: return String(a.role ?? '').localeCompare(String(b.role ?? '')) * dir;
        case 3: return String(a.mobile ?? '').localeCompare(String(b.mobile ?? '')) * dir;
        case 4: return String(a.email ?? '').localeCompare(String(b.email ?? '')) * dir;
        default: {
          // for extra columns, try to use provided render value text if available
          const extraIndex = sortConfig.columnIndex - 5;
          const col = extraColumns[extraIndex];
          if (col && typeof col.sortValue === 'function') {
            return String(col.sortValue(a) || '').localeCompare(String(col.sortValue(b) || '')) * dir;
          }
          return 0;
        }
      }
    });
    return cp;
  }, [customers, sortConfig, extraColumns]);

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
    <CommonTable 
      headers={headers} 
      data={sorted} 
      emptyMessage="暫無客戶資料" 
      onSort={handleSort} 
      sortConfig={sortConfig}
      renderCard={renderCard}
    >
      {sorted.map((c) => (
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
