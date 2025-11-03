import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import { handleCreateEvent } from '../../api/eventListAPI';

const EventCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    console.log('Creating event:', formData);
    try {
      console.log('Creating new event...', formData);
      const res = await handleCreateEvent(formData);
      console.log('Create success:', res);
      alert('Event新增成功！');
      navigate('/events');// Navigate back to events/:id after "submission"
    } catch (err) {
      console.error('Create failed:', err);
      alert('Event新增失敗，請稍後再試');
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