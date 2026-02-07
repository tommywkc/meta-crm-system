import React from 'react';
import { tableStyle, thTdStyle, redTextStyle } from '../styles/TableStyles';
import { getStatusDisplay, getTypeDisplay, formatForDisplay } from '../utils/dateFormatter';

const EventsTable = ({ events = [], role, enrolledEventIds = [], onView, onEdit, onDelete, onEnroll, onHomework, viewButtonLabel = '詳情' }) => {
  const userRole = role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>活動編號</th>
          <th style={thTdStyle}>活動名稱</th>
          <th style={thTdStyle}>類型</th>
          <th style={thTdStyle}>開始日期</th>
          <th style={thTdStyle}>結束日期</th>
          <th style={thTdStyle}>名額</th>
          <th style={thTdStyle}>價格</th>
          {!isMember && <th style={thTdStyle}>狀態</th>}
          <th style={thTdStyle}>操作</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => {
          const isEnrolledForMember = isMember && enrolledEventIds.some((id) => String(id) === String(event.event_id));
          const canShowEnrollButton = isMember || isSalesOrLeader;
          return (
            <tr key={event.id}>
              <td style={thTdStyle}>{event.event_id}</td>
              <td style={thTdStyle}>{event.event_name}</td>
              <td style={thTdStyle}>{getTypeDisplay(event.type)}</td>
              <td style={thTdStyle}>{event.datetime_start != null ? formatForDisplay(event.datetime_start) : '無'}</td>
              <td style={thTdStyle}>{event.datetime_end != null ? formatForDisplay(event.datetime_end) : '無'}</td>
              <td style={thTdStyle}>{event.capacity != null ? `剩餘 ${event.remaining_seats}/${event.capacity}` : '無限制'}</td>
              <td style={thTdStyle}>
                {event.price == null || Number(event.price) === 0
                    ? '免費'
                    : new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 }).format(Number(event.price))}
              </td>
              {!isMember && <td style={thTdStyle}>{getStatusDisplay(event.status)}</td>}
              <td style={thTdStyle}>
                <button onClick={() => onView && onView(event.event_id)}>{viewButtonLabel}</button>
                {onHomework && (
                  <button onClick={() => onHomework(event.event_id)} style={{ marginLeft: 8 }}>功課</button>
                )}
                {isAdmin ? (
                  <>
                    <button onClick={() => onEdit && onEdit(event.event_id)} style={{ marginLeft: 8 }}>編輯</button>
                    <button onClick={() => onDelete && onDelete(event.event_id)} style={{ ...redTextStyle, marginLeft: 8 }}>刪除</button>
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
      </tbody>
    </table>
  );
};

export default EventsTable;