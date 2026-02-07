import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleList, handleFindUserByRole } from '../../api/customersListAPI';
import { handleGetById } from '../../api/eventListAPI';
import { handleCreateEnrollment } from '../../api/enrollmentAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { commonSelectStyle } from '../../styles/SelectStyles';

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
    paymentMethod: 'CREDITCARD'
  });

  const [members, setMembers] = useState([]);
  const [event, setEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membersInput, setMembersInput] = useState('');
  const [memberError, setMemberError] = useState(null);

  // Load event information
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await handleGetById(id);
        setEvent(eventData.event || null);
      } catch (error) {
        console.error('Failed to load event information:', error);
      }
    };
    if (id) {
      fetchEvent();
    }
  }, [id]);

  // Auto-fill form with current user info when role is Member
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

  // Load member list when role is Sales or Leader
  useEffect(() => {
    if (isSalesOrLeader) {
      const fetchMembers = async () => {
        try {
          const response = await handleFindUserByRole('MEMBER');
          setMembers(response.customers || []);
        } catch (error) {
          console.error('Failed to load members list:', error);
        }
      };
      fetchMembers();
    }
  }, [isSalesOrLeader]);

  useEffect(() => {
    if (!formData.studentId) {
      setMembersInput('');
      setMemberError(null);
      return;
    }
    const m = members.find(x => String(x.user_id) === String(formData.studentId));
    if (m) {
      setMembersInput(`${m.user_id} - ${m.name}`);
      setMemberError(null);
    } else {
      // if ID exists but not in list, show raw id
      setMembersInput(String(formData.studentId));
      setMemberError(null);
    }
  }, [formData.studentId, members]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate studentId is filled
    if (!formData.studentId) {
      alert('請選擇或輸入學生 ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const enrollmentData = {
        event_id: parseInt(id, 10),
        user_id: parseInt(formData.studentId, 10),
        enroll_by_id: user?.sub || null,
        payment_method: formData.paymentMethod,
      };

      const result = await handleCreateEnrollment(enrollmentData);
      
      let message = result?.message || '報名成功！';
      if (event?.price != null && Number(event?.price) > 0 && result?.payment?.expire_time) {
        const formattedDateTime = formatDateTimeForDisplay(result.payment.expire_time);
        message += `\n\n請在三個工作天 ${formattedDateTime} 之前付款。`;
      }
      
      alert(message);
      if (event?.price == null || Number(event?.price) === 0) {
        navigate(-1);
      } else {
        if (isSalesOrLeader) {
          navigate(`/payments/${result.payment.payment_id}/process`);
        } else {
          navigate(-1);
        }
      }
      
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error?.message || '報名失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>講座/課堂報名</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>課堂/講座名稱: </label>
          <input
            type="text"
            value={event?.event_name || '載入中...'}
            disabled
          />
        </div>

        <div>
          <label>價格: </label>
          <span style={{ fontWeight: 'bold' }}>
            {event?.price == null || Number(event?.price) === 0
              ? '免費'
              : new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 }).format(Number(event.price))}
          </span>
        </div>

        <div>
          <label>學生ID: </label>
          {isMember ? (
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              disabled
            />
          ) : (
            <>
              <input
                list="members-list"
                value={membersInput}
                  onFocus={() => {
                    // clear current input when user focuses/clicks the field
                    setMembersInput('');
                    setFormData(prev => ({ ...prev, studentId: '', studentName: '' }));
                    setMemberError(null);
                  }}
                  onClick={() => {
                    // also clear on click for safety
                    setMembersInput('');
                    setFormData(prev => ({ ...prev, studentId: '', studentName: '' }));
                    setMemberError(null);
                  }}
                onChange={(e) => {
                  const val = e.target.value;
                  setMembersInput(val);
                  const match = members.find(u => `${u.user_id} - ${u.name}` === val);
                  if (match) {
                    setFormData(prev => ({ ...prev, studentId: String(match.user_id), studentName: match.name }));
                    setMemberError(null);
                  } else {
                    const trimmed = val.trim();
                    if (trimmed === '') {
                      setFormData(prev => ({ ...prev, studentId: '', studentName: '' }));
                      setMemberError(null);
                      return;
                    }
                    if (/^\d+$/.test(trimmed)) {
                      // allow numeric ID input, validate exists in members list
                      setFormData(prev => ({ ...prev, studentId: trimmed }));
                      const exists = members.some(u => String(u.user_id) === trimmed);
                      if (exists) {
                        const m = members.find(u => String(u.user_id) === trimmed);
                        setFormData(prev => ({ ...prev, studentName: m?.name || '' }));
                        setMemberError(null);
                      } else {
                        setFormData(prev => ({ ...prev, studentName: '' }));
                        setMemberError('此學生 ID 不在會員清單');
                      }
                    } else {
                      setFormData(prev => ({ ...prev, studentId: '' , studentName: ''}));
                      setMemberError('請輸入學生 ID（數字），或從清單選擇');
                    }
                  }
                }}
                placeholder="輸入學生ID或從清單選擇"
                style={{ width: '20%', padding: 8, borderColor: memberError ? 'red' : '' }}
                required
              />
              <datalist id="members-list">
                {members.map(u => (
                  <option key={u.user_id} value={`${u.user_id} - ${u.name}`} />
                ))}
              </datalist>
              {memberError && <small style={{ color: 'red' }}>{memberError}</small>}
            </>
          )}
        </div>

        <div>
          <label>學生姓名: </label>
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

        {event?.price != null && Number(event?.price) > 0 && (
          <div>
            <label>支付方式: </label>
            <select 
              name="paymentMethod" 
              value={formData.paymentMethod} 
              onChange={handleInputChange} 
              required
              style={commonSelectStyle}
            >
              <option value="CREDITCARD">信用卡 (Credit Card)</option>
              <option value="CASH">現金</option>
              <option value="FPS">轉數快 (FPS)</option>
              <option value="PAYME">PayMe</option>
            </select>
          </div>
        )}

        <div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '確認報名'}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default Apply;
