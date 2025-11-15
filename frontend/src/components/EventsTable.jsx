import React from 'react';
import { tableStyle, thTdStyle, redTextStyle } from '../styles/TableStyles';
import { getStatusDisplay, getTypeDisplay } from '../utils/dateFormatter';

const EventsTable = ({ events = [], role, onView, onEdit, onDelete, onEnroll }) => {
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
          <th style={thTdStyle}>狀態</th>
          <th style={thTdStyle}>操作</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td style={thTdStyle}>{event.event_id}</td>
            <td style={thTdStyle}>{event.event_name}</td>
            <td style={thTdStyle}>{getTypeDisplay(event.type)}</td>
            <td style={thTdStyle}>{event.datetime_start != null ? event.datetime_start : '無'}</td>
            <td style={thTdStyle}>{event.datetime_end != null ? event.datetime_end : '無'}</td>
            <td style={thTdStyle}>{event.capacity != null ? `剩餘 ${event.remaining_seats}/${event.capacity}` : '無限制'}</td>
            <td style={thTdStyle}>{getStatusDisplay(event.status)}</td>
            <td style={thTdStyle}>
              <button onClick={() => onView && onView(event.event_id)}>詳情</button>
              {isAdmin ? (
                <>
                  <button onClick={() => onEdit && onEdit(event.event_id)} style={{ marginLeft: 8 }}>編輯</button>
                  <button onClick={() => onDelete && onDelete(event.event_id)} style={{ ...redTextStyle, marginLeft: 8 }}>刪除</button>
                </>
              ) : isMember || isSalesOrLeader ? (
                <button onClick={() => onEnroll && onEnroll(event.event_id)} style={{ marginLeft: 8 }}>
                  報名
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EventsTable;