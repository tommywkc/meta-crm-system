import React from 'react';
import CommonTable from './CommonTable';
import { MobileCard, MobileCardRow } from './MobileCard';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

const renderRating = (rating) => {
  if (!rating) return '';
  const parts = String(rating).split(';');
  if (parts.length !== 3) return rating;
  return `UI: ${parts[0]}分 ｜ 流程: ${parts[1]}分 ｜ 流暢: ${parts[2]}分`;
};

const FeedbackTable = ({ feedbacks = [] }) => {
  const headers = ['ID', '測試角色', '評分 (每項滿分：5分)', '文字意見', '提交者 ID', '提交時間'];

  const renderCard = (fb, idx) => (
    <MobileCard key={`card-${fb.feedback_id || idx}`}>
      <MobileCardRow label="ID" value={fb.feedback_id} />
      <MobileCardRow label="測試角色" value={fb.testing_role || 'N/A'} />
      <MobileCardRow label="評分" value={renderRating(fb.rating)} valueStyle={{ wordBreak: 'break-word' }}/>
      <MobileCardRow label="文字意見" value={fb.text || ''} valueStyle={{ wordBreak: 'break-word' }}/>
      <MobileCardRow label="提交者 ID" value={fb.submitted_by_id} />
      <MobileCardRow label="提交時間" value={fb.submit_time ? formatDateTimeForDisplay(fb.submit_time) : ''} />
    </MobileCard>
  );

  return (
    <CommonTable headers={headers} data={feedbacks} emptyMessage="暫時沒有任何意見回饋" renderCard={renderCard}>
      {feedbacks.map((fb) => (
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
