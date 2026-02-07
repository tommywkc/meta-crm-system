import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments } from '../../api/assignmentsAPI';
import { handleGetAssignmentSubmissions } from '../../api/homeworkFilesAPI';
import { apiUrl } from '../../api/apiBase';

const EventHomeworkView = () => {
  const navigate = useNavigate();
  const { id: eventId, assignmentId } = useParams();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const [eventInfo, setEventInfo] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedUsers, setSubmittedUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

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
      setError(null);
      try {
        const assignmentsRes = await handleListAssignments(eventId);
        const found = (assignmentsRes.assignments || []).find((a) => String(a.assignment_id) === String(assignmentId));
        setAssignment(found || null);
        const submissions = await handleGetAssignmentSubmissions(eventId, assignmentId);
        setSubmittedUsers(Array.isArray(submissions.submitted) ? submissions.submitted : []);
        setPendingUsers(Array.isArray(submissions.pending) ? submissions.pending : []);
      } catch (err) {
        setError(err?.message || '載入提交清單失敗');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, assignmentId]);

  const getDownloadUrl = (fileName) => {
    if (!fileName) return null;
    return apiUrl(`/api/homework/download?fileName=${encodeURIComponent(fileName)}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', marginTop: '20px' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ margin: 0 }}>返回</button>
        <h2 style={{ margin: 0 }}>功課提交清單</h2>
      </div>
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}
      {assignment && (
        <p>功課：{assignment.name || 'N/A'}（ID: {assignment.assignment_id}）</p>
      )}



      {loading && <p>載入中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <>
          <h3>已交功課</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>會員 ID</th>
                <th style={thTdStyle}>姓名</th>
                <th style={thTdStyle}>電話</th>
                <th style={thTdStyle}>電郵</th>
                <th style={thTdStyle}>檔案</th>
                <th style={thTdStyle}>提交時間</th>
                <th style={thTdStyle}>結果</th>
                <th style={thTdStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {submittedUsers.length === 0 ? (
                <tr><td style={thTdStyle} colSpan={8}>暫無提交</td></tr>
              ) : submittedUsers.map((item) => (
                <tr key={item.user?.user_id}>
                  <td style={thTdStyle}>{item.user?.user_id}</td>
                  <td style={thTdStyle}>{item.user?.name || 'N/A'}</td>
                  <td style={thTdStyle}>{item.user?.mobile || ''}</td>
                  <td style={thTdStyle}>{item.user?.email || ''}</td>
                  <td style={thTdStyle}>{item.file?.originalName || item.file?.fileName || ''}</td>
                  <td style={thTdStyle}>{item.file?.submittedAt ? formatDateTimeForDisplay(item.file.submittedAt) : 'N/A'}</td>
                  <td style={thTdStyle}>
                    {item.graded ? (
                      <>
                        已批改
                        <button
                          type="button"
                          onClick={() => navigate(`/events/${eventId}/homework/${assignmentId}/result?userId=${item.user?.user_id}`)}
                          style={{ marginLeft: 8 }}
                        >
                          查看結果
                        </button>
                      </>
                    ) : (
                      '未批改'
                    )}
                  </td>
                  <td style={thTdStyle}>
                    {item.file?.fileName ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = getDownloadUrl(item.file.fileName);
                          }}
                          style={{ marginRight: 8 }}
                        >
                          下載
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/events/${eventId}/homework/${assignmentId}/grade/${item.user?.user_id}`)}
                          >
                            批改
                          </button>
                        )}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>未交功課</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>會員 ID</th>
                <th style={thTdStyle}>姓名</th>
                <th style={thTdStyle}>電話</th>
                <th style={thTdStyle}>電郵</th>
                <th style={thTdStyle}>結果</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 ? (
                <tr><td style={thTdStyle} colSpan={5}>全部已提交</td></tr>
              ) : pendingUsers.map((item) => (
                <tr key={item.user?.user_id}>
                  <td style={thTdStyle}>{item.user?.user_id}</td>
                  <td style={thTdStyle}>{item.user?.name || 'N/A'}</td>
                  <td style={thTdStyle}>{item.user?.mobile || ''}</td>
                  <td style={thTdStyle}>{item.user?.email || ''}</td>
                  <td style={thTdStyle}>
                    {item.graded ? (
                      <>
                        已批改
                        <button
                          type="button"
                          onClick={() => navigate(`/events/${eventId}/homework/${assignmentId}/result?userId=${item.user?.user_id}`)}
                          style={{ marginLeft: 8 }}
                        >
                          查看結果
                        </button>
                      </>
                    ) : (
                      '未批改'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default EventHomeworkView;
