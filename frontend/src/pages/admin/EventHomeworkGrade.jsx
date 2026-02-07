import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments } from '../../api/assignmentsAPI';
import { handleGradeSubmission } from '../../api/homeworkFilesAPI';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const EventHomeworkGrade = () => {
  const navigate = useNavigate();
  const { id: eventId, assignmentId, userId } = useParams();

  const [eventInfo, setEventInfo] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!eventId) return;
    handleGetEventById(eventId)
      .then((res) => setEventInfo(res.event || null))
      .catch(() => setEventInfo(null));
  }, [eventId]);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!eventId || !assignmentId) return;
      setLoading(true);
      try {
        const res = await handleListAssignments(eventId);
        const found = (res.assignments || []).find((a) => String(a.assignment_id) === String(assignmentId));
        setAssignment(found || null);
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
  }, [eventId, assignmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleGradeSubmission({
        assignmentId,
        userId,
        score,
        feedback
      });
      alert('已儲存');
      navigate(-1);
    } catch (err) {
      alert(err?.message || '儲存失敗，請稍後再試');
    }
  };

  return (
    <PageContainer>
      <PageHeader title="功課批改" showBack={true} onBack={() => navigate(-1)} />
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}
      {assignment && (
        <p>功課：{assignment.name || 'N/A'}（ID: {assignment.assignment_id}）</p>
      )}
      {userId && <p>會員 ID: {userId}</p>}

      {loading && <p>載入中...</p>}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>
              分數
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>
              評語
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{ width: '100%', minHeight: 80, marginTop: 6 }}
              />
            </label>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button type="button" onClick={() => navigate(-1)} style={{ marginRight: 8 }}>取消</button>
            <button type="submit">儲存</button>
          </div>
        </form>
      )}
    </PageContainer>
  );
};

export default EventHomeworkGrade;
