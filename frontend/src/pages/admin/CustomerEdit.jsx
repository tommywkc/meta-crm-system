import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById, handleUpdateById, handleDeleteById } from '../../api/customersListAPI';
import CustomerForm from '../../components/CustomerForm';

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetById(id);
      setCustomer(data.customer || {});
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      await handleUpdateById(id, formData);
      alert('更新成功');
      navigate('/customers/' + id);
    } catch (error) {
      console.error('Update failed:', error);
      const msg = error?.message;
      alert(msg || '更新資料失敗，請稍後再試');
    }
  };

  const handleDelete = async (user_id) => {
    if (window.confirm('確認要刪除此用戶？')) {
      await handleDeleteById(user_id);  // remove on the backend
      alert('用戶刪除成功');
      navigate('/customers');            // after delete, navigate back to customers list
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <CustomerForm
      title="Edit User: (Admin)"
      submitButtonText="更新"
      initialData={customer}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={handleDelete}
      showUserId={true}
    />
  );
};

export default CustomerEdit;
