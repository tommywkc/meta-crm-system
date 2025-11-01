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
      console.error('更新失敗:', error);
      alert('更新資料失敗，請稍後再試');
    }
  };

  const handleDelete = async (user_id) => {
    if (window.confirm('Comfire to remove this User?')) {
      await handleDeleteById(user_id);  // 從後端刪除
      alert('User deleted successfully');
      navigate('/customers');            // 刪除後導回客戶清單
    }
  };

  const handleCancel = () => {
    navigate('/customers/' + id);
  };

  return (
    <CustomerForm
      title="Edit User: (Admin)"
      submitButtonText="Update"
      initialData={customer}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={handleDelete}
      showUserId={true}
    />
  );
};

export default CustomerEdit;
