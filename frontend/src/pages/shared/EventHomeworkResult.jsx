import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments } from '../../api/assignmentsAPI';
import { handleGetAssignmentSubmissions, handleListHomeworkFiles } from '../../api/homeworkFilesAPI';

const EventHomeworkResult = () => {
  const navigate = useNavigate();
  const { id: eventId, assignmentId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const searchParams = new URLSearchParams(location.search);
  const targetUserId = searchParams.get('userId');

  const [eventInfo, setEventInfo] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({ graded: false, score: null, feedback: null });

  useEffect(() => {
    if (!eventId) return;
    handleGetEventById(eventId)
      .then((res) => setEventInfo(res.event || null))
      .catch(() => setEventInfo(null));
  }, [eventId]);

  useEffect(() => {
    const loadData = async () => {
      if (!eventId || !assignmentId) return;
      setLoading(true);
      try {
        const assignmentsRes = await handleListAssignments(eventId);
        const found = (assignmentsRes.assignments || []).find((a) => String(a.assignment_id) === String(assignmentId));
        setAssignment(found || null);
        if (targetUserId && userRole !== 'member') {
          const submissions = await handleGetAssignmentSubmissions(eventId, assignmentId);
          const foundSubmission = (submissions.submitted || []).find((s) => String(s.user?.user_id) === String(targetUserId))
            || (submissions.pending || []).find((s) => String(s.user?.user_id) === String(targetUserId));
          setResult({
            graded: Boolean(foundSubmission?.graded),
            score: foundSubmission?.score ?? null,
            feedback: foundSubmission?.feedback ?? null
          });
        } else {
          const filesRes = await handleListHomeworkFiles(eventId, assignmentId);
          const first = filesRes.files?.[0];
          setResult({
            graded: Boolean(first?.graded),
            score: first?.score ?? null,
            feedback: first?.feedback ?? null
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, assignmentId, targetUserId, userRole]);

  return (
    <div style={{ padding: 20 }}>
      <h1>功課結果</h1>
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}
      {assignment && (
        <p>功課：{assignment.name || 'N/A'}（ID: {assignment.assignment_id}）</p>
      )}
      {targetUserId && <p>會員 ID: {targetUserId}</p>}

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate(-1)}>返回上一頁</button>
      </div>

      {loading && <p>載入中...</p>}
      {!loading && (
        <>
          {result.graded ? (
            <div>
              <p>分數：{result.score ?? 'N/A'}</p>
              <p>評語：</p>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {result.feedback || 'N/A'}
              </pre>
            </div>
          ) : (
            <p>未批改</p>
          )}
        </>
      )}
    </div>
  );
};

export default EventHomeworkResult;