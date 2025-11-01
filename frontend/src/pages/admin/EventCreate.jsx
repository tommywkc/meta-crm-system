import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';

const EventCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    // For now, just log and navigate back to events list
    console.log('Create event (mock):', formData);
    alert('已模擬建立（不會真的送出）');
    navigate('/events');
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