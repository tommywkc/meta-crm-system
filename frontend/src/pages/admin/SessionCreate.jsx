import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/BatchSessionStyles.css';
import SessionForm from '../../components/SessionForm';
import { handleCreateSession } from '../../api/sessionAPI';

export default function SessionCreate() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const numericEventId = eventId ? Number(eventId) : null;

  const handleSubmit = async (formData) => {
    try {
      const payload = await handleCreateSession({
        ...formData,
        event_id: numericEventId,
      });
      const newSessionId = payload?.session?.session_id;
      alert('場次已建立');
      if (numericEventId) {
        navigate(`/events/${numericEventId}`);
      } else if (newSessionId) {
        navigate(`/sessions/${newSessionId}/edit`);
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('建立場次失敗:', err);
      alert(err?.message || '建立場次失敗，請稍後再試');
    }
  };

  const handleCancel = () => {
    if (numericEventId) {
      navigate(`/events/${numericEventId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <SessionForm
      title="新增場次"
      submitButtonText="建立場次"
      initialData={{ event_id: numericEventId }}
      eventId={numericEventId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
