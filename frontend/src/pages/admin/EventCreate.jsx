import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import { handleCreateEvent } from '../../api/eventListAPI';
import { handleCreateSession } from '../../api/sessionAPI';

const EventCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    console.log('Creating event:', formData);
    try {
      const { sessions, ...eventData } = formData || {};
      const res = await handleCreateEvent(eventData);
      console.log('Create success:', res);
      const createdEventId = res?.event_id || res?.id;
      if (!createdEventId) {
        throw new Error('活動建立成功，但回傳缺少 event_id');
      }
      
      if (sessions && sessions.length > 0) {
        try {
          for (const session of sessions) {
            const sessionData = { ...session, event_id: createdEventId };
            const sessionRes = await handleCreateSession(sessionData);
            console.log('Session created:', sessionRes);
          }
        } catch (sessionErr) {
          console.error('Session creation error:', sessionErr);
          alert(`活動已建立，但場次建立失敗：${sessionErr.message || '請稍後再試'}`);
          return;
        }
      }
      alert('活動新增成功！');
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
      showSessionForm={true}
    />
  );
};

export default EventCreate;