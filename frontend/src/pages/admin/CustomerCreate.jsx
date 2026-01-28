import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleCreate } from '../../api/customersListAPI';
import CustomerForm from '../../components/CustomerForm';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleCreateEnrollment } from '../../api/enrollmentAPI';
import { handleCreateSessionRegistration } from '../../api/sessionAPI';

const CustomerCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 從掃描頁帶入的來源活動，用於預填「來源」欄位（不影響標籤/備註）
  const sourceEvent = location?.state?.sourceEvent;
  const sourceSession = location?.state?.sourceSession;
  const returnPath = location?.state?.returnPath || '';
  const formattedSource = sourceEvent
    ? `現場登記 - ${sourceEvent.type} ${sourceEvent.event_id} ${sourceEvent.event_name || ''}${sourceEvent.datetime_start ? ` (${formatDateTimeForDisplay(sourceEvent.datetime_start)})` : ''}`.trim()
    : undefined;

  const handleSubmit = async (formData) => {
    console.log('Creating customer:', formData);
    try {
      console.log('Creating new customer...', formData);
      const res = await handleCreate(formData); // call API to create a new customer
      console.log('Create success:', res);

      const newUserId = res.newId;

      // 如果是從掃描頁、且有指定活動/場次，嘗試自動幫新客戶報名講座與場次
      if (sourceEvent?.event_id && sourceEvent?.type === 'SEMINAR') {
        try {
          // 先報名活動（講座）
          await handleCreateEnrollment({
            event_id: sourceEvent.event_id,
            user_id: newUserId,
          });

          // 再報名場次（若有帶入場次）
          if (sourceSession?.session_id) {
            try {
              await handleCreateSessionRegistration({
                session_id: sourceSession.session_id,
                user_id: newUserId,
                channel: 'SALES', // 現場由工作人員代為報名
              });
              alert('客戶新增並完成講座與場次報名！');
            } catch (sessionErr) {
              console.error('Auto session registration failed:', sessionErr);
              alert(`客戶新增成功，活動報名成功，但場次報名失敗：${sessionErr.message || '請稍後再試'}`);
            }
          } else {
            alert('客戶新增並完成講座報名！（未指定場次）');
          }
        } catch (enrollErr) {
          console.error('Auto enrollment failed:', enrollErr);
          alert(`客戶新增成功，但活動報名失敗：${enrollErr.message || '請稍後再試'}`);
        }
      } else {
        alert('客戶新增成功！');
      }

      if (returnPath) {
        navigate(returnPath, { replace: true });
        return;
      }

      navigate(`/customers/${newUserId}`);  // after creation, navigate to the new customer's page
    } catch (err) {
      console.error('Create failed:', err);
      const msg = err?.message;
      alert(msg || '新增客戶失敗，請稍後再試');
    }
  };

  const handleCancel = () => {
    if (returnPath) {
      navigate(returnPath);
      return;
    }
    navigate(-1);
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