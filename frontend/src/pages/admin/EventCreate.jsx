import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import { createEventThenSessions } from '../../api/sessionAPI';

const EventCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    console.log('Creating event with sessions:', formData);
    try {
      const { sessions = [], ...eventData } = formData || {};
      // Create event first, then bulk create sessions
      const res = await createEventThenSessions(eventData, sessions);
      console.log('Create success:', res);
      alert('Event 與 場次新增成功！');
      navigate('/events');
    } catch (err) {
      console.error('Create failed:', err);
      alert(`新增失敗：${err.message || '請稍後再試'}`);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <EventForm
      title="建立課堂/講座"
      submitButtonText="建立"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

export default EventCreate;