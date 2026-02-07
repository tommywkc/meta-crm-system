import React from 'react';
import CommonTable from './CommonTable';
import { getStatusDisplay, getTypeDisplay, formatForDisplay } from '../utils/dateFormatter';

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

  return (
    <CommonTable headers={headers}>
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