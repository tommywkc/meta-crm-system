import React from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCreate } from '../../api/customersListAPI';
import CustomerForm from '../../components/CustomerForm';

const CustomerCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    console.log('Creating customer:', formData);
    try {
      console.log('Creating new customer...', formData);
      const res = await handleCreate(formData); // 呼叫 API 建立新客戶
      console.log('Create success:', res);
      alert('客戶新增成功！');
      navigate(`/customers/${res.newId}`);  // 建立完導回new客戶清單
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
      submitButtonText="Create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

export default CustomerCreate;