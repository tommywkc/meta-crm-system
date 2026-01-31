import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tableStyle, thTdStyle } from '../styles/TableStyles';
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
  const nameParts = [session.event_name, session.session_name].filter(Boolean);
  const title = nameParts.length > 0 ? nameParts.join(' / ') : `場次 #${session.session_id}`;
  const timeLabel = session.datetime_start ? formatDateTimeForDisplay(session.datetime_start) : null;
  return (
    <div>
      <div>{title}</div>
      {timeLabel && <div style={{ fontSize: 12, color: '#6b7280' }}>{timeLabel}</div>}
    </div>
  );
};

const RequestsTable = ({ requests = [], loading = false, onApprove }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const columnCount = isAdmin ? 9 : 8;
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

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thTdStyle}>申請編號</th>
          <th style={thTdStyle}>申請人</th>
          <th style={thTdStyle}>申請類型</th>
          <th style={thTdStyle}>原場次</th>
          <th style={thTdStyle}>目標場次</th>
          <th style={thTdStyle}>狀態</th>
          <th style={thTdStyle}>申請時間</th>
          <th style={thTdStyle}>備註</th>
          <th style={thTdStyle}>操作</th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td style={thTdStyle} colSpan={columnCount}>載入中…</td>
          </tr>
        )}
        {!loading && hasData && requests.map((req) => {
          const typeKey = (req.request_type || '').toString().toUpperCase();
          const typeLabel = TYPE_LABELS[typeKey] || req.request_type || '-';
          const requestTimeLabel = req.request_time ? formatDateTimeForDisplay(req.request_time) : '-';
          const applicant = req.user_name ? `${req.user_name} (${req.user_id})` : req.user_id || '-';
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
              <td style={thTdStyle}>{req.request_id}</td>
              <td style={thTdStyle}>{applicant}</td>
              <td style={thTdStyle}>{typeLabel || '-'}</td>
              <td style={thTdStyle}>{renderSessionInfo(oldSession)}</td>
              <td style={thTdStyle}>{renderSessionInfo(newSession)}</td>
              <td style={thTdStyle}>{renderStatus(req.status)}</td>
              <td style={thTdStyle}>{requestTimeLabel}</td>
              <td style={thTdStyle}>{req.remarks || '-'}</td>
              <td style={{ ...thTdStyle, minWidth: 160 }}>
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
                    >
                      批核
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
        {!loading && !hasData && (
          <tr>
            <td style={thTdStyle} colSpan={columnCount}>暫無申請紀錄</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default RequestsTable;
