import React from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';
import { useState, useMemo } from 'react';

const SessionListTable = ({ sessions, role, onEditSession, onEnrollSession, onDeleteSession, isEnrolled, registeredSessionIds = [], allowAdminEnroll = true }) => {
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState(null);
  const handleSort = (colIndex) => {
    setSortConfig((prev) => {
      if (!prev || prev.columnIndex !== colIndex) return { columnIndex: colIndex, direction: 'asc' };
      return { columnIndex: colIndex, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const sortedSessions = useMemo(() => {
    const arr = [...(sessions || [])];
    if (!sortConfig) return arr;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortConfig.columnIndex) {
        case 0: return String(a.session_name ?? '').localeCompare(String(b.session_name ?? '')) * dir;
        case 1: {
          const ta = a.datetime_start ? new Date(a.datetime_start).getTime() : 0;
          const tb = b.datetime_start ? new Date(b.datetime_start).getTime() : 0;
          return (ta - tb) * dir;
        }
        case 2: {
          const ta = a.datetime_end ? new Date(a.datetime_end).getTime() : 0;
          const tb = b.datetime_end ? new Date(b.datetime_end).getTime() : 0;
          return (ta - tb) * dir;
        }
        case 3: return (Number(a.remaining_seats ?? 0) - Number(b.remaining_seats ?? 0)) * dir;
        case 4: return String(a.description ?? '').localeCompare(String(b.description ?? '')) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [sessions, sortConfig]);

  const isMember = role?.toLowerCase() === 'member';
  const showActionColumn = !isMember || isEnrolled;

  const headers = [
    '場次名稱',
    '開始時間',
    '結束時間',
    '剩餘座位數',
    '描述',
    showActionColumn ? '操作' : null
  ].filter(Boolean);

  const renderCard = (session, idx) => {
    const lowerRole = role?.toLowerCase();
    const isMemberRole = lowerRole === 'member';
    const isSalesOrLeader = lowerRole === 'sales' || lowerRole === 'leader';
    const isAdmin = lowerRole === 'admin';
    const isSessionRegisteredForMember = isMemberRole && registeredSessionIds.some(id => String(id) === String(session.session_id));
    const endTimeMs = session.datetime_end ? new Date(session.datetime_end).getTime() : null;
    const isEnded = endTimeMs !== null && !Number.isNaN(endTimeMs) && endTimeMs < Date.now();

    return (
      <MobileCard
        key={`card-${session.session_id || idx}`}
        actions={
          showActionColumn && (
            <>
              {(isSalesOrLeader || isAdmin) ? (
                <button
                  onClick={() => navigate(`/sessions/${session.session_id}/enrolled`)}
                >
                  查看名單
                </button>
              ) : null}

              {(isSalesOrLeader || isAdmin) ? (
                <button
                  onClick={() => navigate(`/waiting?session_id=${session.session_id}`)}
                >
                  查看候補
                </button>
              ) : null}

              {isAdmin ? (
                <>
                  <button onClick={() => onEditSession(session.session_id)}>編輯</button>
                  <button onClick={() => onDeleteSession(session.session_id)} className="btn-danger">刪除</button>
                </>
              ) : null}

              {(isSalesOrLeader || (allowAdminEnroll && isAdmin) || (isMemberRole && isEnrolled)) ? (
                <button
                  onClick={() => {
                    if (!onEnrollSession) return;
                    if (isSessionRegisteredForMember) return;
                    if (isEnded) return;
                    onEnrollSession(session.session_id);
                  }}
                  disabled={isSessionRegisteredForMember || isEnded}
                >
                  {isEnded ? '已完結' : (isSessionRegisteredForMember ? '已報名' : '報名')}
                </button>
              ) : null}
            </>
          )
        }
      >
        <MobileCardRow label="場次名稱" value={session.session_name} />
        <MobileCardRow label="開始時間" value={formatDateTimeForDisplay(session.datetime_start) || 'N/A'} />
        <MobileCardRow label="結束時間" value={formatDateTimeForDisplay(session.datetime_end) || 'N/A'} />
        <MobileCardRow label="剩餘座位數" value={session.remaining_seats ?? 'N/A'} />
        <MobileCardRow label="描述" value={session.description || '-'} valueStyle={{ wordBreak: 'break-word' }}/>
      </MobileCard>
    );
  };

  return (
    <CommonTable headers={headers} data={sortedSessions} emptyMessage="此活動暫無場次" onSort={handleSort} sortConfig={sortConfig} renderCard={renderCard}>
      {sortedSessions.map((session) => {
        const lowerRole = role?.toLowerCase();
        const isMemberRole = lowerRole === 'member';
        const isSalesOrLeader = lowerRole === 'sales' || lowerRole === 'leader';
        const isAdmin = lowerRole === 'admin';
        const isSessionRegisteredForMember = isMemberRole && registeredSessionIds.some(id => String(id) === String(session.session_id));
        const endTimeMs = session.datetime_end ? new Date(session.datetime_end).getTime() : null;
        const isEnded = endTimeMs !== null && !Number.isNaN(endTimeMs) && endTimeMs < Date.now();

        return (
          <tr key={session.session_id}>
            <td>{session.session_name}</td>
            <td>{formatDateTimeForDisplay(session.datetime_start) || 'N/A'}</td>
            <td>{formatDateTimeForDisplay(session.datetime_end) || 'N/A'}</td>
            <td>{session.remaining_seats ?? 'N/A'}</td>
            <td>{session.description || '-'}</td>
            {showActionColumn && (
              <td>
                {/* Permissions: same as EventsTable */}
                {(isSalesOrLeader || isAdmin) ? (
                  <button
                    onClick={() => navigate(`/sessions/${session.session_id}/enrolled`)}
                  >
                    查看名單
                  </button>
                ) : null}

                {(isSalesOrLeader || isAdmin) ? (
                  <button
                    onClick={() => navigate(`/waiting?session_id=${session.session_id}`)}
                    style={{ marginLeft: 8 }}
                  >
                    查看候補
                  </button>
                ) : null}

                {isAdmin ? (
                  <>
                    <button onClick={() => onEditSession(session.session_id)} style={{ marginLeft: 8 }}>編輯</button>
                    <button onClick={() => onDeleteSession(session.session_id)} className="btn-danger" style={{ marginLeft: 8 }}>刪除</button>
                  </>
                ) : null}

                {/* Sales and Leader or Member (if enrolled) can enroll */}
                {(isSalesOrLeader || (isMemberRole && isEnrolled)) ? (
                  <button
                    onClick={() => {
                      if (!onEnrollSession) return;
                      // 會員且該場次已報名時，不再觸發 onEnrollSession
                      if (isSessionRegisteredForMember) return;
                      if (isEnded) return;
                      onEnrollSession(session.session_id);
                    }}
                    style={{ marginLeft: 8 }}
                    disabled={isSessionRegisteredForMember || isEnded}
                  >
                    {isEnded ? '已完結' : (isSessionRegisteredForMember ? '已報名' : '報名')}
                  </button>
                ) : null}
              </td>
            )}
          </tr>
        );
      })}
    </CommonTable>
  );
};

export default SessionListTable;
