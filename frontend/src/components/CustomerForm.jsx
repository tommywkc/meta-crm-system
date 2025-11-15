import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { redTextStyle } from '../styles/TableStyles';


const CustomerForm = ({ 
  title = "客戶表單", 
  submitButtonText = "提交", 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  onDelete = null,
  showUserId = false 
}) => {
  const [password, setPassword] = useState(initialData.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(initialData.name || '');
  const [mobile, setMobile] = useState(initialData.mobile || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [role, setRole] = useState(initialData.role || '會員');
  const [ownerSales, setOwnerSales] = useState(initialData.owner_sales || '');
  const [team, setTeam] = useState(initialData.team || '');
  const [tags, setTags] = useState(initialData.tags || '');
  const [specialNotes, setSpecialNotes] = useState(initialData.note_special || '');
  const location = useLocation();
  const isCreatePage = location.pathname === '/customers/create';
  const [source, setSource] = useState(
    isCreatePage ? '網頁' : (initialData.source || '')
  );

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setSource(initialData.source || (isCreatePage ? '網頁' : ''));
    }
  }, [initialData, isCreatePage]);
  

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setPassword(initialData.password || '');
      setName(initialData.name || '');
      setMobile(initialData.mobile || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || '會員');
      setSource(initialData.source || '');
      setOwnerSales(initialData.owner_sales || '');
      setTeam(initialData.team || '');
      setTags(initialData.tags || '');
      setSpecialNotes(initialData.note_special || '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      password,
      name,
      mobile,
      email,
      role,
      source,
      owner_sales: ownerSales,
      team,
      tags,
      note_special: specialNotes,
    };
    onSubmit(formData);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{title}</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 600 }}>
        {showUserId && initialData.user_id && (
          <div>
            <p><strong>編輯用戶 ID: </strong><br /><u>{initialData.user_id}</u></p>
          </div>
        )}


        <div style={{ marginBottom: 8 }}>
          <label><strong>角色:</strong></label>
          <br />
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            style={{ width: '103%', padding: 8 }}
          >
            <option value="MEMBER">會員</option>
            <option value="SALES">銷售</option>
            <option value="LEADER">領導</option>
            <option value="ADMIN">管理員</option>
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>姓名:</label>
          <br />
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>手機號碼:</label>
          <br />
          <input 
            value={mobile} 
            onChange={(e) => setMobile(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>密碼:</label>
          <br />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              type={showPassword ? "text" : "password"}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ flex: 1, padding: 8 }} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '隱藏密碼' : '顯示密碼'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>電子郵件:</label>
          <br />
          <input 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>來源:</label>
          <br />
          <input 
            value={source} 
            onChange={(e) => setSource(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
            placeholder="客戶來源 (如: Google廣告, 朋友介紹等)"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>負責銷售:</label><br/>
          <input
            type="text"
            value={ownerSales ?? ''}
            onChange={(e) => setOwnerSales(e.target.value)}
            style={{ width: '100%', padding: 8, borderColor: !/^\d*$/.test(ownerSales || '') ? 'red' : '' }}
          />
          {!/^\d*$/.test(ownerSales || '') && (
            <small style={{ color: 'red' }}>請只輸入銷售 ID。</small>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>團隊:</label>
          <br />
          <input 
            value={team} 
            onChange={(e) => setTeam(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
            placeholder="所屬團隊"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>標籤:</label>
          <br />
          <input 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
            placeholder="標籤 (用逗號分隔)"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>特別備註:</label>
          <br />
          <textarea 
            value={specialNotes} 
            onChange={(e) => setSpecialNotes(e.target.value)} 
            style={{ width: '100%', padding: 8, minHeight: 60 }} 
            placeholder="特殊備註"
          />
        </div>

        {showUserId && initialData.qr_token && (
          <div style={{ marginBottom: 8 }}>
            <p><strong>QR Token:</strong><br /><u>{initialData.qr_token}</u></p>
          </div>
        )}

        {showUserId && initialData.create_time && (
          <div style={{ marginBottom: 8 }}>
            <p><strong>創建時間:</strong><br /><u>{initialData.create_time}</u></p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button type="submit" style={{ marginRight: 8 }}>
            {submitButtonText}
          </button>
          <button type="button" onClick={onCancel} style={{ marginRight: 8 }}>
            取消
          </button>
          {onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(initialData.user_id)} 
              style={{ ...redTextStyle, marginLeft: 8 }}
            >
              刪除
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;