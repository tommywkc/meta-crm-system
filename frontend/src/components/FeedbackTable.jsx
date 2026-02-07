import React from 'react';
import CommonTable from './CommonTable';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

const renderRating = (rating) => {
  if (!rating) return '';
  const parts = String(rating).split(';');
  if (parts.length !== 3) return rating;
  return `UI: ${parts[0]}分 ｜ 流程: ${parts[1]}分 ｜ 流暢: ${parts[2]}分`;
};

const FeedbackTable = ({ feedbacks = [] }) => {
  const headers = ['ID', '測試角色', '評分 (每項滿分：5分)', '文字意見', '提交者 ID', '提交時間'];

  return (
    <CommonTable headers={headers}>
      {feedbacks.length === 0 ? (
        <tr>
          <td colSpan={6}>暫時沒有任何意見回饋</td>
        </tr>
      ) : (
        feedbacks.map((fb) => (
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
        ))
      )}
    </CommonTable>
  );
};

export default FeedbackTable;
