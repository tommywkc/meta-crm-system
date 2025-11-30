import React from 'react';
import { tableStyle, thTdStyle } from '../styles/TableStyles';

const SessionListTable = ({ sessions }) => {
  if (!sessions || sessions.length === 0) {
    return <div style={{ marginTop: 12, color: '#666' }}>此活動暫無場次</div>;
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>場次編號</th>
          <th style={thTdStyle}>場次名稱</th>
          <th style={thTdStyle}>開始時間</th>
          <th style={thTdStyle}>結束時間</th>
          <th style={thTdStyle}>可容納人數</th>
          <th style={thTdStyle}>描述</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <tr key={session.session_id}>
            <td style={thTdStyle}>{session.session_id}</td>
            <td style={thTdStyle}>{session.session_name}</td>
            <td style={thTdStyle}>{session.datetime_start || 'N/A'}</td>
            <td style={thTdStyle}>{session.datetime_end || 'N/A'}</td>
            <td style={thTdStyle}>{session.capacity || 'N/A'}</td>
            <td style={thTdStyle}>{session.description || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SessionListTable;
