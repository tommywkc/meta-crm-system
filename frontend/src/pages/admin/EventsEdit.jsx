import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../api/eventListAPI';
import EventForm from '../../components/EventForm';


const EventsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState([]);
      useEffect(() => {
        const fetchData = async () => {
          const data = await handleGetById(id);
          setEvent(data.event || {});
        };
        fetchData();
      }, [id]);
  
  const handleSubmit = async (formData) => {
    try{
      await handleUpdateById(id, formData);
      alert('更新成功');
      navigate('/events/'+id);
    }catch (error) {
      console.error('Update failed:', error);
      alert('更新資料失敗，請稍後再試');
    }
  };



  const handleCancel = () => {
    navigate('/events/'+id);
  };

  const handleDelete = async (event_id) => {
    if (window.confirm('Comfire to remove this event?')) {
      await handleDeleteById(event_id);  // remove on the backend
      alert('User deleted successfully');         // after delete, navigate back to events list
      navigate('/events');
    }
  };

  return (
    <EventForm
      title="編輯課堂/講座"
      submitButtonText="更新"
      initialData={event}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={handleDelete}
      showEventId={true}
    />
  );
};

export default EventsEdit;
