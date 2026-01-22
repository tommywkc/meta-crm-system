import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments, handleCreateAssignment, handleUpdateAssignment, handleDeleteAssignment } from '../../api/assignmentsAPI';
import { handleDeleteHomeworkFile, handleGetAssignmentSubmissions, handleListHomeworkFiles, handleUploadHomeworkFile } from '../../api/homeworkFilesAPI';

const buildDatetimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

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

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [submittedUsers, setSubmittedUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', deadline: '' });

  const isMember = (user?.role || '').toLowerCase() === 'member';

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

  const handleOpenModal = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        name: assignment.name || '',
        description: assignment.description || '',
        deadline: buildDatetimeLocal(assignment.deadline)
      });
    } else {
      setEditingAssignment(null);
      setFormData({ name: '', description: '', deadline: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      event_id: eventId,
      name: formData.name.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline || null
    };

    try {
      if (editingAssignment) {
        await handleUpdateAssignment(editingAssignment.assignment_id, payload);
      } else {
        await handleCreateAssignment(payload);
      }
      handleCloseModal();
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert('儲存失敗，請稍後再試');
    }
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

  const handleViewSubmissions = async (assignment) => {
    if (!assignment || !eventId) return;
    setViewOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewAssignment(assignment);
    try {
      const payload = await handleGetAssignmentSubmissions(eventId, assignment.assignment_id);
      setSubmittedUsers(Array.isArray(payload.submitted) ? payload.submitted : []);
      setPendingUsers(Array.isArray(payload.pending) ? payload.pending : []);
    } catch (err) {
      setViewError(err?.message || '載入提交清單失敗');
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewAssignment(null);
    setSubmittedUsers([]);
    setPendingUsers([]);
    setViewError(null);
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
        {!isMember && (
          <button onClick={() => handleOpenModal()}>新增功課</button>
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
                  {!isMember ? (
                    <>
                      <button onClick={() => handleOpenModal(item)} style={{ marginRight: 8 }}>編輯</button>
                      <button onClick={() => handleDelete(item.assignment_id)} style={{ color: 'red' }}>刪除</button>
                      <button onClick={() => handleViewSubmissions(item)} style={{ marginLeft: 8 }}>查看</button>
                    </>
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

      {!isMember && isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 420 }}>
            <h2>{editingAssignment ? '編輯功課' : '新增功課'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label>
                  名稱
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', marginTop: 6 }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>
                  描述
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', minHeight: 80, marginTop: 6 }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>
                  截止日期
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{ width: '100%', marginTop: 6 }}
                  />
                </label>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={handleCloseModal} style={{ marginRight: 8 }}>取消</button>
                <button type="submit">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isMember && viewOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 720, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>功課提交清單</h2>
              <button onClick={handleCloseView}>關閉</button>
            </div>

            {viewAssignment && (
              <p>功課：{viewAssignment.name || 'N/A'}（ID: {viewAssignment.assignment_id}）</p>
            )}

            {viewLoading && <p>載入中...</p>}
            {viewError && <p style={{ color: 'red' }}>{viewError}</p>}

            {!viewLoading && !viewError && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {submittedUsers.length === 0 ? (
                      <tr><td style={thTdStyle} colSpan={5}>暫無提交</td></tr>
                    ) : submittedUsers.map((item) => (
                      <tr key={item.user?.user_id}>
                        <td style={thTdStyle}>{item.user?.user_id}</td>
                        <td style={thTdStyle}>{item.user?.name || 'N/A'}</td>
                        <td style={thTdStyle}>{item.user?.mobile || ''}</td>
                        <td style={thTdStyle}>{item.user?.email || ''}</td>
                        <td style={thTdStyle}>{item.file?.originalName || item.file?.fileName || ''}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.length === 0 ? (
                      <tr><td style={thTdStyle} colSpan={4}>全部已提交</td></tr>
                    ) : pendingUsers.map((item) => (
                      <tr key={item.user?.user_id}>
                        <td style={thTdStyle}>{item.user?.user_id}</td>
                        <td style={thTdStyle}>{item.user?.name || 'N/A'}</td>
                        <td style={thTdStyle}>{item.user?.mobile || ''}</td>
                        <td style={thTdStyle}>{item.user?.email || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventHomework;
