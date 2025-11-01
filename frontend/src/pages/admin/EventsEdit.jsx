import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';

const mockClasses = {
  E1: {
    id: 'E1',
    name: 'AI Animation 9A',
    category: '課堂',
    schedule: '2025-11-12 19:00',
    seatsLimit: 60,
    remainingSeats: 4,
    status: '公開',
    instructor: '王老師',
    location: 'A教室'
  },
  E2: {
    id: 'E2',
    name: 'Seminar-SEP-03',
    category: '講座',
    schedule: '2025-09-03 14:00',
    seatsLimit: null,
    remainingSeats: null,
    status: '草稿',
    instructor: 'Guest',
    location: '大廳'
  }
};

const EventsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const eventData = mockClasses[id] || { 
    id, 
    name: '', 
    category: '', 
    schedule: '', 
    seatsLimit: '', 
    status: '草稿', 
    instructor: '', 
    location: '' 
  };

  const handleSubmit = (formData) => {
    // For now, just log and navigate back to events list
    console.log('Update event (mock):', { id, ...formData });
    alert('已模擬更新（不會真的送出）');
    navigate('/events');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <EventForm
      title="編輯課堂/講座"
      submitButtonText="更新"
      initialData={eventData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

export default EventsEdit;
