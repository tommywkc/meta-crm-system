import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleCreate } from '../../api/customersListAPI';
import CustomerForm from '../../components/CustomerForm';

const CustomerCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 從掃描頁帶入的來源活動，用於預填「來源」欄位（不影響標籤/備註）
  const sourceEvent = location?.state?.sourceEvent;
  const formattedSource = sourceEvent
    ? `現場登記 - ${sourceEvent.type} ${sourceEvent.event_id} ${sourceEvent.event_name || ''}${sourceEvent.datetime_start ? ` (${sourceEvent.datetime_start})` : ''}`.trim()
    : undefined;

  const handleSubmit = async (formData) => {
    console.log('Creating customer:', formData);
    try {
      console.log('Creating new customer...', formData);
  const res = await handleCreate(formData); // call API to create a new customer
      console.log('Create success:', res);
  alert('客戶新增成功！');
  navigate(`/customers/${res.newId}`);  // after creation, navigate to the new customer's page
    } catch (err) {
      console.error('Create failed:', err);
      alert('新增客戶失敗，請稍後再試');
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  return (
    <CustomerForm
      title="Create User(Admin)"
      submitButtonText="新增"
      initialData={{ ...(formattedSource ? { source: formattedSource } : {}) }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

export default CustomerCreate;