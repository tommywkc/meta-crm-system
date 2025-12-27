import React from 'react';
import { tableStyle, thTdStyle, redTextStyle } from '../styles/TableStyles';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

const SessionListTable = ({ sessions, role, onEditSession, onEnrollSession, onDeleteSession, isEnrolled, registeredSessionIds = [] }) => {
  if (!sessions || sessions.length === 0) {
    return <div style={{ marginTop: 12, color: '#666' }}>此活動暫無場次</div>;
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = new Date(a.datetime_start);
    const dateB = new Date(b.datetime_start);
    return dateA - dateB;
  });

  const isMember = role?.toLowerCase() === 'member';
  const showActionColumn = !isMember || isEnrolled;

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>場次名稱</th>
          <th style={thTdStyle}>開始時間</th>
          <th style={thTdStyle}>結束時間</th>
          <th style={thTdStyle}>可容納人數</th>
          <th style={thTdStyle}>描述</th>
          {showActionColumn && <th style={thTdStyle}>操作</th>}
        </tr>
      </thead>
      <tbody>
        {sortedSessions.map((session) => {
          const lowerRole = role?.toLowerCase();
          const isMemberRole = lowerRole === 'member';
          const isSalesOrLeader = lowerRole === 'sales' || lowerRole === 'leader';
          const isSessionRegisteredForMember = isMemberRole && registeredSessionIds.some(id => String(id) === String(session.session_id));

          return (
            <tr key={session.session_id}>
              <td style={thTdStyle}>{session.session_name}</td>
              <td style={thTdStyle}>{formatDateTimeForDisplay(session.datetime_start) || 'N/A'}</td>
              <td style={thTdStyle}>{formatDateTimeForDisplay(session.datetime_end) || 'N/A'}</td>
              <td style={thTdStyle}>{session.capacity || 'N/A'}</td>
              <td style={thTdStyle}>{session.description || '-'}</td>
              {showActionColumn && (
                <td style={thTdStyle}>
                  {/* Permissions: same as EventsTable */}
                  {lowerRole === 'admin' ? (
                    <>
                      <button onClick={() => onEditSession && onEditSession(session.session_id)}>編輯</button>
                      <button onClick={() => onDeleteSession && onDeleteSession(session.session_id)} style={redTextStyle}>刪除</button>
                    </>
                  ) : null}
                  {/* Sales and Leader or Member (if enrolled) can enroll */}
                  {(isSalesOrLeader || (isMemberRole && isEnrolled)) ? (
                    <button
                      onClick={() => {
                        if (!onEnrollSession) return;
                        // 會員且該場次已報名時，不再觸發 onEnrollSession
                        if (isSessionRegisteredForMember) return;
                        onEnrollSession(session.session_id);
                      }}
                      style={{ marginLeft: 8 }}
                      disabled={isSessionRegisteredForMember}
                    >
                      {isSessionRegisteredForMember ? '已報名' : '報名'}
                    </button>
                  ) : null}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default SessionListTable;
