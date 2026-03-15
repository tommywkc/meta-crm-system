import React from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
import { getStatusDisplay, getTypeDisplay, formatForDisplay } from '../utils/dateFormatter';

const EventsTable = ({ events = [], role, enrolledEventIds = [], onView, onEdit, onDelete, onEnroll, onHomework, viewButtonLabel = '詳情', sortBy, sortOrder, onSort }) => {
  const userRole = role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';        

  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) return <span style={{ color: '#ccc', marginLeft: 4 }}>↕</span>;
    return sortOrder === 'asc' ? <span style={{ marginLeft: 4 }}>↑</span> : <span style={{ marginLeft: 4 }}>↓</span>;
  };

  const headers = [
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('event_id')}>活動編號 {renderSortIcon('event_id')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('event_name')}>活動名稱 {renderSortIcon('event_name')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('type')}>類型 {renderSortIcon('type')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('datetime_start')}>開始日期 {renderSortIcon('datetime_start')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('datetime_end')}>結束日期 {renderSortIcon('datetime_end')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('capacity')}>名額 {renderSortIcon('capacity')}</span>,
    <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('price')}>價格 {renderSortIcon('price')}</span>,
    !isMember ? <span style={{ cursor: 'pointer' }} onClick={() => onSort && onSort('status')}>狀態 {renderSortIcon('status')}</span> : null,
    '操作'
  ].filter(Boolean);

  const renderCard = (event, idx) => {
    const isEnrolledForMember = isMember && enrolledEventIds.some((id) => String(id) === String(event.event_id));
    const canShowEnrollButton = isMember || isSalesOrLeader;

    return (
      <MobileCard
        key={`card-${event.id || idx}`}
        actions={
          <>
            <button onClick={() => onView && onView(event.event_id)}>{viewButtonLabel}</button>
            {onHomework && (
              <button onClick={() => onHomework(event.event_id)}>功課</button>
            )}
            {isAdmin ? (
              <>
                <button onClick={() => onEdit && onEdit(event.event_id)}>編輯</button>
                <button onClick={() => onDelete && onDelete(event.event_id)} className="btn-danger">刪除</button>
              </>
            ) : canShowEnrollButton ? (
              <button
                onClick={() => {
                  if (!onEnroll) return;
                  if (isMember && isEnrolledForMember) return;
                  onEnroll(event.event_id);
                }}
                disabled={isEnrolledForMember}
              >
                {isEnrolledForMember ? '已報名' : '報名'}
              </button>
            ) : null}
          </>
        }
      >
        <MobileCardRow label="活動編號" value={event.event_id} />
        <MobileCardRow label="活動名稱" value={event.event_name} />
        <MobileCardRow label="類型" value={getTypeDisplay(event.type)} />
        <MobileCardRow label="開始日期" value={event.datetime_start != null ? formatForDisplay(event.datetime_start) : '無'} />
        <MobileCardRow label="結束日期" value={event.datetime_end != null ? formatForDisplay(event.datetime_end) : '無'} />
        <MobileCardRow label="名額" value={event.capacity != null ? `剩餘 ${event.remaining_seats}/${event.capacity}` : '無限制'} />
        <MobileCardRow label="價格" value={event.price == null || Number(event.price) === 0 ? '免費' : new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 }).format(Number(event.price))} />
        {!isMember && <MobileCardRow label="狀態" value={getStatusDisplay(event.status)} />}
      </MobileCard>
    );
  };

  return (
    <CommonTable headers={headers} data={events} emptyMessage="暫無活動資料" renderCard={renderCard}>
      {events.map((event) => {
        const isEnrolledForMember = isMember && enrolledEventIds.some((id) => String(id) === String(event.event_id));
        const canShowEnrollButton = isMember || isSalesOrLeader;
        return (
          <tr key={event.id}>
            <td>{event.event_id}</td>
            <td>{event.event_name}</td>
            <td>{getTypeDisplay(event.type)}</td>
            <td>{event.datetime_start != null ? formatForDisplay(event.datetime_start) : '無'}</td>
            <td>{event.datetime_end != null ? formatForDisplay(event.datetime_end) : '無'}</td>
            <td>{event.capacity != null ? `剩餘 ${event.remaining_seats}/${event.capacity}` : '無限制'}</td>
            <td>
              {event.price == null || Number(event.price) === 0
                  ? '免費'
                  : new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 }).format(Number(event.price))}
            </td>
            {!isMember && <td>{getStatusDisplay(event.status)}</td>}
            <td>
              <button onClick={() => onView && onView(event.event_id)}>{viewButtonLabel}</button>
              {onHomework && (
                <button onClick={() => onHomework(event.event_id)} style={{ marginLeft: 8 }}>功課</button>
              )}
              {isAdmin ? (
                <>
                  <button onClick={() => onEdit && onEdit(event.event_id)} style={{ marginLeft: 8 }}>編輯</button>
                  <button onClick={() => onDelete && onDelete(event.event_id)} className="btn-danger" style={{ marginLeft: 8 }}>刪除</button>
                </>
              ) : canShowEnrollButton ? (
                <button
                  onClick={() => {
                    if (!onEnroll) return;
                    // 會員已報名時不再觸發 onEnroll
                    if (isMember && isEnrolledForMember) return;
                    onEnroll(event.event_id);
                  }}
                  style={{ marginLeft: 8 }}
                  disabled={isEnrolledForMember}
                >
                  {isEnrolledForMember ? '已報名' : '報名'}
                </button>
              ) : null}
            </td>
          </tr>
        );
      })}
    </CommonTable>
  );
};

export default EventsTable;