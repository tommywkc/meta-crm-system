import React, { useMemo } from 'react';
import { tableStyle, thTdStyle } from '../styles/TableStyles';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

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

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' || typeof value === 'number') return value;
  return JSON.stringify(value);
};

const RequestViewTable = ({ request }) => {
  const fieldRows = useMemo(() => {
    if (!request) return [];
    const typeKey = (request.request_type || '').toString().toUpperCase();
    const typeLabel = TYPE_LABELS[typeKey] || request.request_type || '-';
    const requestBy = request.request_by_name
      ? `${request.request_by_name} (${request.request_by_id || '-'})`
      : request.request_by_id || '-';
    const applicant = request.user_name
      ? `${request.user_name} (${request.user_id || '-'})`
      : request.user_id || '-';

    const baseRows = [
      { label: '申請編號', value: formatValue(request.request_id) },
      { label: '申請人', value: applicant },
      { label: '申請類型', value: typeLabel },
      { label: '狀態', value: renderStatus(request.status), isNode: true },
      { label: '申請時間', value: request.request_time ? formatDateTimeForDisplay(request.request_time) : '-' },
      { label: '申請發起人', value: requestBy },
      { label: '活動', value: formatValue(request.old_event_name) },
      {
        label: '目標場次',
        value: `${formatValue(request.new_session_id)}: ${formatValue(request.new_session_name)} (${request.new_session_start ? formatDateTimeForDisplay(request.new_session_start) : '-' })`,
      },
      { label: '三個工作天', value: formatValue(request.under_3bday) },
      { label: '時間衝突', value: formatValue(request.time_conflict) },
      { label: '優先級別', value: formatValue(request.priority_tier) },
      { label: '申請備註', value: formatValue(request.remarks) },
      { label: '批核時間', value: request.determine_time ? formatDateTimeForDisplay(request.determine_time) : '-' },
    ];

    if (typeKey === 'RESCHEDULE') {
      baseRows.splice(7, 0, {
        label: '原場次',
        value: `${formatValue(request.old_session_id)}: ${formatValue(request.old_session_name)} (${request.old_session_start ? formatDateTimeForDisplay(request.old_session_start) : '-' })`,
      });
    }

    const usedKeys = new Set([
      'request_id',
      'request_type',
      'status',
      'request_time',
      'determine_time',
      'remarks',
      'user_id',
      'user_name',
      'user_mobile',
      'user_email',
      'request_by_id',
      'request_by_name',
      'old_session_id',
      'old_session_name',
      'old_session_start',
      'old_event_name',
      'new_session_id',
      'new_session_name',
      'new_session_start',
      'new_event_name',
      'registration_id',
      'under_3bday',
      'priority_tier',
      'time_conflict',
    ]);

    const extraRows = Object.entries(request)
      .filter(([key]) => !usedKeys.has(key))
      .map(([key, value]) => ({
        label: key,
        value: formatValue(value),
      }));

    return [...baseRows, ...extraRows];
  }, [request]);

  if (!request) return null;

  return (
    <table style={tableStyle}>
      <tbody>
        {fieldRows.map((row, idx) => (
          <tr key={`${row.label}-${idx}`}>
            <th style={{ ...thTdStyle, width: 180, textAlign: 'left' }}>{row.label}</th>
            <td style={thTdStyle}>{row.isNode ? row.value : formatValue(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default RequestViewTable;
