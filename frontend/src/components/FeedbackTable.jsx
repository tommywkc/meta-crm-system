import React from 'react';
import { tableStyle, thTdStyle } from '../styles/TableStyles';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

const headerStyle = {
  ...thTdStyle,
  fontWeight: 'bold',
};

const renderRating = (rating) => {
  if (!rating) return '';
  const parts = String(rating).split(';');
  if (parts.length !== 3) return rating;
  return `UI: ${parts[0]}分 ｜ 流程: ${parts[1]}分 ｜ 流暢: ${parts[2]}分`;
};

const FeedbackTable = ({ feedbacks = [] }) => {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={headerStyle}>ID</th>
          <th style={headerStyle}>測試角色</th>
          <th style={headerStyle}>評分 (每項滿分：5分)</th>
          <th style={headerStyle}>文字意見</th>
          <th style={headerStyle}>提交者 ID</th>
          <th style={headerStyle}>提交時間</th>
        </tr>
      </thead>
      <tbody>
        {feedbacks.length === 0 ? (
          <tr>
            <td style={thTdStyle} colSpan={6}>暫時沒有任何意見回饋</td>
          </tr>
        ) : (
          feedbacks.map((fb) => (
            <tr key={fb.feedback_id}>
              <td style={thTdStyle}>{fb.feedback_id}</td>
              <td style={thTdStyle}>{fb.testing_role || 'N/A'}</td>
              <td style={thTdStyle}>{renderRating(fb.rating)}</td>
              <td style={thTdStyle}>{fb.text || ''}</td>
              <td style={thTdStyle}>{fb.submitted_by_id}</td>
              <td style={thTdStyle}>
                {fb.submit_time ? formatDateTimeForDisplay(fb.submit_time) : ''}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default FeedbackTable;
