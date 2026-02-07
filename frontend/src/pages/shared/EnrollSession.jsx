import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListConfirmedUsersByEvent } from '../../api/enrollmentAPI';
import { handleGetById } from '../../api/eventListAPI';
import { handleGetSessionById, handleCreateSessionRegistration } from '../../api/sessionAPI';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const EnrollSession = () => {
  const { id } = useParams(); // event_id from /events/:id/enrollsession
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role?.toLowerCase();
  const isMember = userRole === 'member';
  const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
  });

  const [members, setMembers] = useState([]);
  const [event, setEvent] = useState(null);
  const [session, setSession] = useState(null);
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

  // Load session information
  useEffect(() => {
    const fetchSession = async () => {
      try {
        if (!sessionId) return;
        const res = await handleGetSessionById(sessionId);
        setSession(res.session || null);
      } catch (error) {
        console.error('Failed to load session information:', error);
      }
    };
    fetchSession();
  }, [sessionId]);

  // Auto-fill form with current user info when role is Member
  useEffect(() => {
    if (isMember && user) {
      setFormData((prev) => ({
        ...prev,
        studentId: user.id || '',
        studentName: user.name || '',
      }));
    }
  }, [isMember, user]);

  // Load member list when role is Sales or Leader - only members who already confirmed enrollment for this event
  useEffect(() => {
    if (isSalesOrLeader && id) {
      const fetchMembers = async () => {
        try {
          const response = await handleListConfirmedUsersByEvent(id);
          setMembers(response.users || []);
        } catch (error) {
          console.error('Failed to load members list:', error);
        }
      };
      fetchMembers();
    }
  }, [isSalesOrLeader]);

  // Sync selected member display
  useEffect(() => {
    if (!formData.studentId) {
      setMembersInput('');
      setMemberError(null);
      return;
    }
    const m = members.find((x) => String(x.user_id) === String(formData.studentId));
    if (m) {
      setMembersInput(`${m.user_id} - ${m.name}`);
      setMemberError(null);
    } else {
      setMembersInput(String(formData.studentId));
      setMemberError(null);
    }
  }, [formData.studentId, members]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentId) {
      alert('請選擇或輸入學生 ID');
      return;
    }

    if (!id) {
      alert('缺少活動 ID，無法報名');
      return;
    }

    setIsSubmitting(true);

    try {
      const roleUpper = (user?.role || '').toUpperCase();
      let channel = 'WEB';
      if (roleUpper === 'SALES') channel = 'SALES';
      else if (roleUpper === 'LEADER') channel = 'LEADER';

      const registrationData = {
        session_id: sessionId ? parseInt(sessionId, 10) : null,
        user_id: parseInt(formData.studentId, 10),
        registration_by_id: user?.sub || null,
        channel,
      };

      if (!registrationData.session_id) {
        alert('缺少場次 ID，無法報名此場次');
        setIsSubmitting(false);
        return;
      }

      const result = await handleCreateSessionRegistration(registrationData);

      let message = result?.message || '場次報名成功！';
      alert(message);
      // 場次報名完成後返回該活動詳情頁
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Session registration failed:', error);
      alert(error?.message || '場次報名失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 場次報名頁面不顯示價格與支付方式

  return (
    <PageContainer>
      <PageHeader 
        title="場次報名" 
        showBack={true} 
        onBack={() => navigate(-1)} 
      />

      <form onSubmit={handleSubmit}>
        <div>
          <label>課堂/講座名稱: </label>
          <input type="text" value={event?.event_name || '載入中...'} disabled />
        </div>

        <div>
          <label>場次: </label>
          <input
            type="text"
            value={
              session
                ? `${session.session_name || ''} (${session.datetime_start ? formatDateTimeForDisplay(session.datetime_start) : 'N/A'})`
                : '載入中...'
            }
            disabled
            style={{ width: '20%' }}
          />
        </div>

        {/* 價格不在場次報名頁面顯示 */}

        <div>
          <label>學生ID: </label>
          {isMember ? (
            <input type="text" name="studentId" value={formData.studentId} disabled />
          ) : (
            <>
              <input
                list="members-list"
                value={membersInput}
                onFocus={() => {
                  setMembersInput('');
                  setFormData((prev) => ({ ...prev, studentId: '', studentName: '' }));
                  setMemberError(null);
                }}
                onClick={() => {
                  setMembersInput('');
                  setFormData((prev) => ({ ...prev, studentId: '', studentName: '' }));
                  setMemberError(null);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setMembersInput(val);
                  const match = members.find((u) => `${u.user_id} - ${u.name}` === val);
                  if (match) {
                    setFormData((prev) => ({ ...prev, studentId: String(match.user_id), studentName: match.name }));
                    setMemberError(null);
                  } else {
                    const trimmed = val.trim();
                    if (trimmed === '') {
                      setFormData((prev) => ({ ...prev, studentId: '', studentName: '' }));
                      setMemberError(null);
                      return;
                    }
                    if (/^\d+$/.test(trimmed)) {
                      setFormData((prev) => ({ ...prev, studentId: trimmed }));
                      const exists = members.some((u) => String(u.user_id) === trimmed);
                      if (exists) {
                        const m = members.find((u) => String(u.user_id) === trimmed);
                        setFormData((prev) => ({ ...prev, studentName: m?.name || '' }));
                        setMemberError(null);
                      } else {
                        setFormData((prev) => ({ ...prev, studentName: '' }));
                        setMemberError('此學生 ID 不在會員清單');
                      }
                    } else {
                      setFormData((prev) => ({ ...prev, studentId: '', studentName: '' }));
                      setMemberError('請輸入學生 ID（數字），或從清單選擇');
                    }
                  }
                }}
                placeholder="輸入學生ID或從清單選擇"
                style={{ width: '20%', padding: 8, borderColor: memberError ? 'red' : '' }}
                required
              />
              <datalist id="members-list">
                {members.map((u) => (
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
            <input type="text" name="studentName" value={formData.studentName} disabled />
          ) : (
            <input type="text" name="studentName" value={formData.studentName} readOnly />
          )}
        </div>

        {/* 支付方式不在場次報名頁面顯示 */}

        <div style={{ marginTop: 20 }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '確認報名'}
          </button>
          <button
            type="button"
            style={{ marginLeft: 8 }}
            onClick={() => navigate(-1)}
          >
            取消
          </button>
        </div>
      </form>
    </PageContainer>
  );
};

export default EnrollSession;