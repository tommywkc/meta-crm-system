import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleCreateAssignment } from '../../api/assignmentsAPI';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const EventHomeworkCreate = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();

  const [eventInfo, setEventInfo] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    handleGetEventById(eventId)
      .then((res) => setEventInfo(res.event || null))
      .catch(() => setEventInfo(null));
  }, [eventId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!eventId) return;
    setSaving(true);
    try {
      await handleCreateAssignment({
        event_id: eventId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline || null
      });
      navigate(`/events/${eventId}/homework`);
    } catch (err) {
      alert(err?.message || '新增失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="新增功課" showBack={true} onBack={() => navigate(-1)} />
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}

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
    </PageContainer>
  );
};

export default EventHomeworkCreate;
