import React from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
import { getStatusDisplay, getTypeDisplay, formatForDisplay } from '../utils/dateFormatter';

import { useState, useMemo } from 'react';

const EventsTable = ({ events = [], role, enrolledEventIds = [], onView, onEdit, onDelete, onEnroll, onHomework, viewButtonLabel = '詳情' }) => {
  const userRole = role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';

  const headers = [
    '活動編號', '活動名稱', '類型', '開始日期', '結束日期', '名額', '價格',
    !isMember ? '狀態' : null,
    '操作'
  ].filter(Boolean);
  // sorting state: column index and direction ('asc'|'desc')
  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (columnIndex) => {
    setSortConfig((prev) => {
      if (!prev || prev.columnIndex !== columnIndex) return { columnIndex, direction: 'asc' };
      return { columnIndex, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const sortedEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (!sortConfig) return events;
    const { columnIndex, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    const compare = (a, b) => {
      // map column index to comparator
      switch (columnIndex) {
        case 0: {
          // 活動編號 - numeric
          const na = Number(a.event_id ?? 0);
          const nb = Number(b.event_id ?? 0);
          return (na - nb) * dir;
        }
        case 1: {
          // 活動名稱 - string A-Z
          return String(a.event_name ?? '').localeCompare(String(b.event_name ?? ''), 'zh-HK') * dir;
        }
        case 2: {
          // 類型 - display string
          return String(getTypeDisplay(a.type) ?? '').localeCompare(String(getTypeDisplay(b.type) ?? ''), 'zh-HK') * dir;
        }
        case 3: {
          // 開始日期 - earliest first
          const ta = a.datetime_start ? new Date(a.datetime_start).getTime() : 0;
          const tb = b.datetime_start ? new Date(b.datetime_start).getTime() : 0;
          return (ta - tb) * dir;
        }
        case 4: {
          // 結束日期
          const ta = a.datetime_end ? new Date(a.datetime_end).getTime() : 0;
          const tb = b.datetime_end ? new Date(b.datetime_end).getTime() : 0;
          return (ta - tb) * dir;
        }
        case 5: {
          // 名額 - compare remaining seats (少至多)
          const na = Number(a.remaining_seats ?? a.capacity ?? 0);
          const nb = Number(b.remaining_seats ?? b.capacity ?? 0);
          return (na - nb) * dir;
        }
        case 6: {
          // 價格 - numeric
          const pa = a.price == null ? 0 : Number(a.price);
          const pb = b.price == null ? 0 : Number(b.price);
          return (pa - pb) * dir;
        }
        default: {
          // fallback to event_id
          const na = Number(a.event_id ?? 0);
          const nb = Number(b.event_id ?? 0);
          return (na - nb) * dir;
        }
      }
    };

    const copy = [...events];
    copy.sort((a, b) => compare(a, b));
    return copy;
  }, [events, sortConfig]);

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
    <CommonTable headers={headers} data={sortedEvents} emptyMessage="暫無活動資料" onSort={handleSort} sortConfig={sortConfig} renderCard={renderCard}>
      {sortedEvents.map((event) => {
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