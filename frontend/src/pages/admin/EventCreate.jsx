import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import { handleCreateEvent } from '../../api/eventListAPI';

const EventCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    console.log('Creating event:', formData);
    try {
      // Remove sessions from formData, only create event
      const { sessions, ...eventData } = formData || {};
      const res = await handleCreateEvent(eventData);
      console.log('Create success:', res);
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
    />
  );
};

export default EventCreate;