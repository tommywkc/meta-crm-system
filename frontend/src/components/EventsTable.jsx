import React from 'react';
import { tableStyle, thTdStyle, redTextStyle } from '../styles/TableStyles';

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
          <th style={thTdStyle}>Start Date</th>
          <th style={thTdStyle}>End Date</th>
          <th style={thTdStyle}>Capacity</th>
          <th style={thTdStyle}>Status</th>
          <th style={thTdStyle}>Action</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td style={thTdStyle}>{event.event_id}</td>
            <td style={thTdStyle}>{event.event_name}</td>
            <td style={thTdStyle}>{event.type}</td>
            <td style={thTdStyle}>{event.datetime_start != null ? event.datetime_start : 'N/A'}</td>
            <td style={thTdStyle}>{event.datetime_end != null ? event.datetime_end : 'N/A'}</td>
            <td style={thTdStyle}>{event.capacity != null ? `餘 ${event.remaining_seats}\/${event.capacity}` : '無限制'}</td>
            <td style={thTdStyle}>{event.status}</td>
            <td style={thTdStyle}>
              <button onClick={() => onView && onView(event.event_id)}>Details</button>
              {isAdmin ? (
                <>
                  <button onClick={() => onEdit && onEdit(event.event_id)} style={{ marginLeft: 8 }}>Edit</button>
                  <button onClick={() => onDelete && onDelete(event.event_id)} style={{ ...redTextStyle, marginLeft: 8 }}>Delete</button>
                </>
              ) : isMember || isSalesOrLeader ? (
                <button onClick={() => onEnroll && onEnroll(event.event_id)} style={{ marginLeft: 8 }}>
                  {isMember ? '報名' : '報名'}
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