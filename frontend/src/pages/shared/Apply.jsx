import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleList } from '../../api/customersListAPI';
import { getEventById } from '../../api/eventListAPI';

const Apply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = user?.role?.toLowerCase();
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    paymentMethod: 'Credit Card'
  });

  const [members, setMembers] = useState([]);
  const [event, setEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 載入事件信息
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await getEventById(id);
        setEvent(eventData.event || null);
      } catch (error) {
        console.error('取得事件信息失敗:', error);
      }
    };
    if (id) {
      fetchEvent();
    }
  }, [id]);

  // Member 時自動填入自己的資訊
  useEffect(() => {
    if (isMember && user) {
      console.log('User object:', user);
      setFormData(prev => ({
        ...prev,
        studentId: user.id || '',
        studentName: user.name || ''
      }));
    }
  }, [isMember, user]);

  // Sales/Leader 時載入 Member 列表
  useEffect(() => {
    if (isSalesOrLeader) {
      const fetchMembers = async () => {
        try {
          const response = await handleList(1000, 0);
          // 過濾出角色為 member 的用戶
          const memberList = response.customers?.filter(u => u.role?.toLowerCase() === 'member') || [];
          setMembers(memberList);
        } catch (error) {
          console.error('取得成員列表失敗:', error);
        }
      };
      fetchMembers();
    }
  }, [isSalesOrLeader]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberSelect = (e) => {
    const selectedMemberId = e.target.value;
    console.log('Selected value:', selectedMemberId);
    console.log('Members list:', members);
    const selectedMember = members.find(m => String(m.user_id) === selectedMemberId);
    console.log('Found member:', selectedMember);
    if (selectedMember) {
      console.log('Setting form data with ID:', selectedMember.user_id, 'Name:', selectedMember.name);
      setFormData(prev => ({
        ...prev,
        studentId: selectedMember.user_id,
        studentName: selectedMember.name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      console.log('報名數據:', {
        eventId: id,
        studentId: formData.studentId,
        studentName: formData.studentName,
        paymentMethod: formData.paymentMethod,
        registeredBy: user?.sub,
        registeredAt: new Date().toISOString()
      });

      alert('報名成功！感謝你的參與。');
      navigate('/events');
    } catch (error) {
      console.error('報名失敗:', error);
      alert('報名失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>講座/課堂報名</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>課堂/講座名稱</label>
          <input
            type="text"
            value={event?.event_name || '載入中...'}
            disabled
          />
        </div>

        <div>
          <label>學生ID</label>
          {isMember ? (
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              disabled
            />
          ) : (
            <select name="studentId" value={formData.studentId} onChange={handleMemberSelect} required>
              <option value="">-- 選擇成員 --</option>
              {members.map(member => {
                console.log('Rendering member option:', member.user_id, member.name);
                return (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user_id} - {member.name}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div>
          <label>學生姓名</label>
          {isMember ? (
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              disabled
            />
          ) : (
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              readOnly
            />
          )}
        </div>

        <div>
          <label>支付方式</label>
          <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} required>
            <option value="Credit Card">Credit Card</option>
            <option value="現金">現金</option>
            <option value="Payme">Payme</option>
          </select>
        </div>

        <div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '確認報名'}
          </button>
          <button type="button" onClick={() => navigate('/events')}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default Apply;
