import React from 'react';
import CommonTable from './CommonTable';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';
import { useState, useMemo } from 'react';

const renderRating = (rating) => {
  if (!rating) return '';
  const parts = String(rating).split(';');
  if (parts.length !== 3) return rating;
  return `UI: ${parts[0]}分 ｜ 流程: ${parts[1]}分 ｜ 流暢: ${parts[2]}分`;
};

const FeedbackTable = ({ feedbacks = [] }) => {
  const headers = ['ID', '測試角色', '評分 (每項滿分：5分)', '文字意見', '提交者 ID', '提交時間'];

  const [sortConfig, setSortConfig] = useState(null);
  const handleSort = (col) => setSortConfig((prev) => {
    if (!prev || prev.columnIndex !== col) return { columnIndex: col, direction: 'asc' };
    return { columnIndex: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
  });

  const sorted = useMemo(() => {
    if (!Array.isArray(feedbacks)) return [];
    if (!sortConfig) return feedbacks;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    const avgRating = (r) => {
      if (!r) return 0;
      const parts = String(r).split(';').map(x => Number(x) || 0);
      if (parts.length === 0) return 0;
      return parts.reduce((s, v) => s + v, 0) / parts.length;
    };
    const cp = [...feedbacks];
    cp.sort((a, b) => {
      switch (sortConfig.columnIndex) {
        case 0: return (Number(a.feedback_id ?? 0) - Number(b.feedback_id ?? 0)) * dir;
        case 1: return String(a.testing_role ?? '').localeCompare(String(b.testing_role ?? '')) * dir;
        case 2: return (avgRating(a.rating) - avgRating(b.rating)) * dir;
        case 3: return String(a.text ?? '').localeCompare(String(b.text ?? '')) * dir;
        case 4: return String(a.submitted_by_id ?? '').localeCompare(String(b.submitted_by_id ?? '')) * dir;
        case 5: {
          const ta = a.submit_time ? new Date(a.submit_time).getTime() : 0;
          const tb = b.submit_time ? new Date(b.submit_time).getTime() : 0;
          return (ta - tb) * dir;
        }
        default: return 0;
      }
    });
    return cp;
  }, [feedbacks, sortConfig]);

  return (
    <CommonTable headers={headers} data={sorted} emptyMessage="暫時沒有任何意見回饋" onSort={handleSort} sortConfig={sortConfig}>
      {sorted.map((fb) => (
        <tr key={fb.feedback_id}>
          <td>{fb.feedback_id}</td>
          <td>{fb.testing_role || 'N/A'}</td>
          <td>{renderRating(fb.rating)}</td>
          <td>{fb.text || ''}</td>
          <td>{fb.submitted_by_id}</td>
          <td>
            {fb.submit_time ? formatDateTimeForDisplay(fb.submit_time) : ''}
          </td>
        </tr>
      ))}
    </CommonTable>
  );
};

export default FeedbackTable;
