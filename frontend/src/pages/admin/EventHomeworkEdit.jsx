import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments, handleUpdateAssignment } from '../../api/assignmentsAPI';

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

const EventHomeworkEdit = () => {
  const navigate = useNavigate();
  const { id: eventId, assignmentId } = useParams();

  const [eventInfo, setEventInfo] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setFormData({
          name: found?.name || '',
          description: found?.description || '',
          deadline: buildDatetimeLocal(found?.deadline)
        });
      } catch (err) {
        setAssignment(null);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [eventId, assignmentId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!eventId || !assignmentId) return;
    setSaving(true);
    try {
      await handleUpdateAssignment(assignmentId, {
        event_id: eventId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline || null
      });
      navigate(`/events/${eventId}/homework`);
    } catch (err) {
      alert(err?.message || '更新失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>編輯功課</h2>
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}

      {loading && <p>載入中...</p>}
      {!loading && !assignment && <p>找不到功課資料。</p>}

      {!loading && assignment && (
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
            <button type="button" onClick={() => navigate(-1)} style={{ marginRight: 8 }}>取消</button>
            <button type="submit" disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EventHomeworkEdit;
