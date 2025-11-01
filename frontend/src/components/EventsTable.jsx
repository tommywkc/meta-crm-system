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
          <th style={thTdStyle}>Event ID</th>
          <th style={thTdStyle}>Event Name</th>
          <th style={thTdStyle}>Type</th>
          <th style={thTdStyle}>Date Start</th>
          <th style={thTdStyle}>Capacity</th>
          <th style={thTdStyle}>Status</th>
          <th style={thTdStyle}>Action</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td style={thTdStyle}>{event.event_id}</td>
            <td style={thTdStyle}>{event.name}</td>
            <td style={thTdStyle}>{event.type}</td>
            <td style={thTdStyle}>{event.datetime_start}</td>
            <td style={thTdStyle}>{event.capacity != null ? `餘 ${event.remainingSeats}` : ''}</td>
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