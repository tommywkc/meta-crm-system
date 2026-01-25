import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments, handleDeleteAssignment } from '../../api/assignmentsAPI';
import { handleDeleteHomeworkFile, handleListHomeworkFiles, handleUploadHomeworkFile } from '../../api/homeworkFilesAPI';

const EventHomework = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { user } = useAuth();

  const [eventInfo, setEventInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filesByAssignment, setFilesByAssignment] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const uploadInputRefs = useRef({});

  const userRole = (user?.role || '').toLowerCase();
  const isMember = userRole === 'member';
  const isAdmin = userRole === 'admin';
  const isStaff = !isAdmin && !isMember;

  useEffect(() => {
    if (!eventId) return;
    handleGetEventById(eventId)
      .then((res) => setEventInfo(res.event || null))
      .catch(() => setEventInfo(null));
  }, [eventId]);

  const fetchAssignments = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await handleListAssignments(eventId);
      setAssignments(Array.isArray(res.assignments) ? res.assignments : []);
    } catch (err) {
      console.error(err);
      setError('載入功課失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [eventId]);

  useEffect(() => {
    const loadFiles = async () => {
      if (!isMember || assignments.length === 0) return;
      const results = {};
      await Promise.all(
        assignments.map(async (item) => {
          try {
            const payload = await handleListHomeworkFiles(eventId, item.assignment_id);
            results[item.assignment_id] = Array.isArray(payload.files) ? payload.files : [];
          } catch (err) {
            results[item.assignment_id] = [];
          }
        })
      );
      setFilesByAssignment(results);
    };

    loadFiles();
  }, [assignments, isMember]);

  const handleGoCreate = () => {
    if (!eventId) return;
    navigate(`/admin/events/${eventId}/homework/create`);
  };

  const handleGoEdit = (assignmentId) => {
    if (!eventId || !assignmentId) return;
    navigate(`/admin/events/${eventId}/homework/${assignmentId}/edit`);
  };

  const handleGoView = (assignmentId) => {
    if (!eventId || !assignmentId) return;
    navigate(`/events/${eventId}/homework/${assignmentId}`);
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('確認要刪除此功課？')) return;
    try {
      await handleDeleteAssignment(assignmentId);
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert('刪除失敗，請稍後再試');
    }
  };

  const handleUploadFile = async (assignmentId, file) => {
    if (!file) return;
    setUploadingId(assignmentId);
    try {
      await handleUploadHomeworkFile(eventId, assignmentId, file);
      await fetchAssignments();
    } catch (err) {
      alert(err?.message || '上傳失敗，請稍後再試');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!fileName) return;
    if (!window.confirm('確認要刪除此檔案？')) return;
    try {
      await handleDeleteHomeworkFile(fileName);
      await fetchAssignments();
    } catch (err) {
      alert(err?.message || '刪除失敗，請稍後再試');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>功課</h1>
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}

      <div style={{ marginBottom: 16 }}>
        {isAdmin && (
          <button onClick={handleGoCreate}>新增功課</button>
        )}
        <button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>返回上一頁</button>
      </div>

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>ID</th>
            <th style={thTdStyle}>名稱</th>
            <th style={thTdStyle}>描述</th>
            <th style={thTdStyle}>截止日期</th>
            <th style={thTdStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {assignments.length === 0 ? (
            <tr>
              <td style={thTdStyle} colSpan={5}>暫無功課</td>
            </tr>
          ) : (
            assignments.map((item) => (
              <tr key={item.assignment_id}>
                <td style={thTdStyle}>{item.assignment_id}</td>
                <td style={thTdStyle}>{item.name}</td>
                <td style={thTdStyle}>
                  <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{item.description}</pre>
                </td>
                <td style={thTdStyle}>
                  {item.deadline ? formatDateTimeForDisplay(item.deadline) : 'N/A'}
                </td>
                <td style={thTdStyle}>
                  {isAdmin ? (
                    <>
                      <button onClick={() => handleGoView(item.assignment_id)} style={{ marginRight: 8 }}>查看</button>
                      <button onClick={() => handleGoEdit(item.assignment_id)} style={{ marginRight: 8 }}>編輯</button>
                      <button onClick={() => handleDelete(item.assignment_id)} style={{ color: 'red' }}>刪除</button>
                    </>
                  ) : isStaff ? (
                    <button onClick={() => handleGoView(item.assignment_id)}>查看</button>
                  ) : (
                    <>
                      <input
                        type="file"
                        ref={(el) => { uploadInputRefs.current[item.assignment_id] = el; }}
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadFile(item.assignment_id, e.target.files?.[0])}
                      />
                      <button
                        onClick={() => uploadInputRefs.current[item.assignment_id]?.click()}
                        disabled={uploadingId === item.assignment_id}
                        style={{ marginRight: 8 }}
                      >
                        {uploadingId === item.assignment_id ? '上傳中...' : '上傳'}
                      </button>
                      {(filesByAssignment[item.assignment_id] || []).map((file) => (
                        <div key={file.fileName} style={{ marginTop: 6 }}>
                          <span>{file.originalName || file.fileName}</span>
                          <button
                            onClick={() => handleDeleteFile(file.fileName)}
                            style={{ marginLeft: 8, color: 'red' }}
                          >
                            刪除
                          </button>
                        </div>
                      ))}
                      {(filesByAssignment[item.assignment_id] || []).length === 0 && (
                        <span>未上傳</span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      )}

    </div>
  );
};

export default EventHomework;
