import React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';

const TYPE_LABELS = {
  LEAVE: '請假',
  RESCHEDULE: '改期',
  MAKEUP: '補堂',
  RETAKE: '覆課',
};

const STATUS_LABELS = {
  PENDING: '待審核',
  APPROVED: '已批准',
  REJECTED: '已拒絕',
  CANCELLED: '已取消',
};

const STATUS_COLORS = {
  PENDING: '#d97706',
  APPROVED: '#15803d',
  REJECTED: '#b91c1c',
  CANCELLED: '#6b7280',
};

const badgeBaseStyle = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const renderStatus = (statusRaw) => {
  if (!statusRaw) return '-';
  const upper = statusRaw.toUpperCase();
  const label = STATUS_LABELS[upper] || statusRaw;
  const color = STATUS_COLORS[upper] || '#475569';
  return (
    <span
      style={{
        ...badgeBaseStyle,
        color,
        backgroundColor: `${color}1a`,
      }}
    >
      {label}
    </span>
  );
};

const renderSessionInfo = (session) => {
  if (!session?.session_id) {
    return '-';
  }
  const title = session.session_name || `場次 #${session.session_id}`;
  const timeLabel = session.datetime_start ? formatDateTimeForDisplay(session.datetime_start) : null;
  return (
    <div>
      <div>{title}</div>
      {timeLabel && <div style={{ fontSize: 12, color: '#6b7280' }}>{timeLabel}</div>}
    </div>
  );
};

const renderRequestContent = (typeKey, oldSession, newSession) => {
  const eventName = oldSession?.event_name || newSession?.event_name || '-';
  if (typeKey === 'RESCHEDULE') {
    return (
      <div>
        <div>{eventName}</div>
        <div style={{ marginTop: 4 }}>{renderSessionInfo(oldSession)}</div>
        <div style={{ color: '#d97706', fontSize: 16, margin: '4px 0' }}>→</div>
        {renderSessionInfo(newSession)}
      </div>
    );
  }

  const targetSession = typeKey === 'LEAVE' ? oldSession : newSession;

  return (
    <div>
      <div>{eventName}</div>
      <div style={{ marginTop: 4 }}>{renderSessionInfo(targetSession)}</div>
    </div>
  );
};

const RequestsTable = ({ requests = [], loading = false, onApprove }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const hasData = requests && requests.length > 0;

  const handleApprove = (req) => {
    if (!isAdmin) return;
    if (typeof onApprove === 'function') {
      onApprove(req);
    }
  };

  const handleViewDetail = (req) => {
    if (!req?.request_id) return;
    navigate(`/requests/${req.request_id}`, { state: { request: req } });
  };

  const headers = ['申請編號', '申請人', '申請類型', '申請內容', '狀態', '申請時間', '條件衝突', '操作'];

  const [sortConfig, setSortConfig] = useState(null);
  const handleSort = (col) => setSortConfig((prev) => {
    if (!prev || prev.columnIndex !== col) return { columnIndex: col, direction: 'asc' };
    return { columnIndex: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
  });

  const sortedRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    if (!sortConfig) return requests;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const cmp = (a, b) => {
      switch (sortConfig.columnIndex) {
        case 0: return (Number(a.request_id ?? 0) - Number(b.request_id ?? 0)) * dir;
        case 1: return String(a.user_name || a.user_id || '').localeCompare(String(b.user_name || b.user_id || '')) * dir;
        case 2: return String(a.request_type || '').localeCompare(String(b.request_type || '')) * dir;
        case 3: {
          const ea = a.new_event_name || a.old_event_name || '';
          const eb = b.new_event_name || b.old_event_name || '';
          return String(ea).localeCompare(String(eb)) * dir;
        }
        case 4: return String(a.status || '').localeCompare(String(b.status || '')) * dir;
        case 5: {
          const ta = a.request_time ? new Date(a.request_time).getTime() : 0;
          const tb = b.request_time ? new Date(b.request_time).getTime() : 0;
          return (ta - tb) * dir;
        }
        case 6: {
          const ca = (a.under_3bday || a.time_conflict) ? 1 : 0;
          const cb = (b.under_3bday || b.time_conflict) ? 1 : 0;
          return (ca - cb) * dir;
        }
        default: return 0;
      }
    };
    const cp = [...requests];
    cp.sort(cmp);
    return cp;
  }, [requests, sortConfig]);

  const renderCard = (req, idx) => {
    const typeKey = (req.request_type || '').toString().toUpperCase();
    const typeLabel = TYPE_LABELS[typeKey] || req.request_type || '-';
    const requestTimeLabel = req.request_time ? formatDateTimeForDisplay(req.request_time) : '-';
    const applicant = req.user_name ? `${req.user_name} (${req.user_id})` : req.user_id || '-';
    const isPending = (req.status || '').toString().toUpperCase() === 'PENDING';
    const oldSession = {
      session_id: req.old_session_id,
      session_name: req.old_session_name,
      event_name: req.old_event_name,
      datetime_start: req.old_session_start,
    };
    const newSession = {
      session_id: req.new_session_id,
      session_name: req.new_session_name,
      event_name: req.new_event_name,
      datetime_start: req.new_session_start,
    };

    return (
      <MobileCard
        key={`card-${req.request_id || idx}`}
        actions={
          <>
            <button
                type="button"
                onClick={() => handleViewDetail(req)}
            >
                詳情
            </button>
            {isAdmin && (
                <button
                type="button"
                onClick={() => handleApprove(req)}
                disabled={!isPending}
                >
                {isPending ? '批核' : '已批核'}
                </button>
            )}
          </>
        }
      >
        <MobileCardRow label="申請編號" value={req.request_id} />
        <MobileCardRow label="申請人" value={applicant} />
        <MobileCardRow label="申請類型" value={typeLabel || '-'} />
        <MobileCardRow label="申請內容">
            {renderRequestContent(typeKey, oldSession, newSession)}
        </MobileCardRow>
        <MobileCardRow label="狀態">
            {renderStatus(req.status)}
        </MobileCardRow>
        <MobileCardRow label="申請時間" value={requestTimeLabel} />
        <MobileCardRow label="條件衝突" value={(req.under_3bday || req.time_conflict) ? '有衝突' : '無衝突'} />
      </MobileCard>
    );
  };

  return (
    <CommonTable headers={headers} data={loading ? null : sortedRequests} emptyMessage="暫無申請紀錄" onSort={handleSort} sortConfig={sortConfig} renderCard={renderCard}>
      {loading && (
        <tr>
          <td colSpan={8}>載入中…</td>
        </tr>
      )}
      {!loading && sortedRequests.map((req) => {
        const typeKey = (req.request_type || '').toString().toUpperCase();
        const typeLabel = TYPE_LABELS[typeKey] || req.request_type || '-';
        const requestTimeLabel = req.request_time ? formatDateTimeForDisplay(req.request_time) : '-';
        const applicant = req.user_name ? `${req.user_name} (${req.user_id})` : req.user_id || '-';
        const isPending = (req.status || '').toString().toUpperCase() === 'PENDING';
        const oldSession = {
          session_id: req.old_session_id,
          session_name: req.old_session_name,
          event_name: req.old_event_name,
          datetime_start: req.old_session_start,
        };
        const newSession = {
          session_id: req.new_session_id,
          session_name: req.new_session_name,
          event_name: req.new_event_name,
          datetime_start: req.new_session_start,
        };
        return (
          <tr key={req.request_id}>
            <td>{req.request_id}</td>
            <td>{applicant}</td>
            <td>{typeLabel || '-'}</td>
            <td>{renderRequestContent(typeKey, oldSession, newSession)}</td>
            <td>{renderStatus(req.status)}</td>
            <td>{requestTimeLabel}</td>
            <td>{(req.under_3bday || req.time_conflict) ? '有衝突' : '無衝突'}</td>
            <td style={{ minWidth: 160 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleViewDetail(req)}
                >
                  詳情
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleApprove(req)}
                    disabled={!isPending}
                  >
                    {isPending ? '批核' : '已批核'}
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </CommonTable>
  );
};

export default RequestsTable;
