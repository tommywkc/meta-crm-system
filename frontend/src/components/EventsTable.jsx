import React from 'react';
import { tableStyle, thTdStyle } from '../styles/TableStyles';

const EventsTable = ({ events = [], role, onView, onEdit, onDelete, onEnroll }) => {
  const userRole = role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>名稱</th>
          <th style={thTdStyle}>類別</th>
          <th style={thTdStyle}>場次/時間</th>
          <th style={thTdStyle}>剩餘名額</th>
          <th style={thTdStyle}>狀態</th>
          <th style={thTdStyle}>動作</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td style={thTdStyle}>{event.name}</td>
            <td style={thTdStyle}>{event.category}</td>
            <td style={thTdStyle}>{event.schedule}</td>
            <td style={thTdStyle}>{event.remainingSeats != null ? `餘 ${event.remainingSeats}` : ''}</td>
            <td style={thTdStyle}>{event.status}</td>
            <td style={thTdStyle}>
              <button onClick={() => onView && onView(event.id)}>Details</button>
              {isAdmin ? (
                <>
                  <button onClick={() => onEdit && onEdit(event.id)} style={{ marginLeft: 8 }}>Edit</button>
                  <button onClick={() => onDelete && onDelete(event.id)} style={{ marginLeft: 8 }}>Delete</button>
                </>
              ) : isMember ? (
                <button onClick={() => onEnroll && onEnroll(event.id)} style={{ marginLeft: 8 }}>報名</button>
              ) : (
                // sales/leader 只能查看，不顯示其他按鈕
                null
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EventsTable;