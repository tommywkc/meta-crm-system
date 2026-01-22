import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments, handleCreateAssignment, handleUpdateAssignment, handleDeleteAssignment } from '../../api/assignmentsAPI';

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
            {!isMember && <th style={thTdStyle}>操作</th>}
          </tr>
        </thead>
        <tbody>
          {assignments.length === 0 ? (
            <tr>
              <td style={thTdStyle} colSpan={isMember ? 4 : 5}>暫無功課</td>
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
                {!isMember && (
                  <td style={thTdStyle}>
                    <button onClick={() => handleOpenModal(item)} style={{ marginRight: 8 }}>編輯</button>
                    <button onClick={() => handleDelete(item.assignment_id)} style={{ color: 'red' }}>刪除</button>
                  </td>
                )}
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
    </div>
  );
};

export default EventHomework;
