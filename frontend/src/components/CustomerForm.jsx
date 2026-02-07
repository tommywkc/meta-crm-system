import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { handleFindUsersByRoles } from '../api/customersListAPI';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';
import { commonSelectStyle } from '../styles/SelectStyles';


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
  const [mobile, setMobile] = useState(
    initialData.mobile
      ? String(initialData.mobile).replace(/\D/g, '').slice(-8)
      : ''
  );
  const [mobileError, setMobileError] = useState(null);
  const [email, setEmail] = useState(initialData.email || '');
  const [role, setRole] = useState(initialData.role || 'MEMBER');
  const [ownerSales, setOwnerSales] = useState(initialData.owner_sales || '');
  const [team, setTeam] = useState(initialData.team || '');
  const [tags, setTags] = useState(initialData.tags || '');
  const [specialNotes, setSpecialNotes] = useState(initialData.note_special || '');
  const [salesLeaders, setSalesLeaders] = useState([]);
  const [salesInput, setSalesInput] = useState('');
  const [ownerSalesError, setOwnerSalesError] = useState(null);
  const [members, setMembers] = useState([]);
  const [referrerInput, setReferrerInput] = useState('');
  const [referrerId, setReferrerId] = useState(initialData.referrer_id || '');
  const [referrerError, setReferrerError] = useState(null);
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
      setMobile(
        initialData.mobile
          ? String(initialData.mobile).replace(/\D/g, '').slice(-8)
          : ''
      );
      setEmail(initialData.email || '');
      setRole(initialData.role || 'MEMBER');
      setSource(initialData.source || '');
      setOwnerSales(initialData.owner_sales || '');
      setTeam(initialData.team || '');
      setTags(initialData.tags || '');
      setSpecialNotes(initialData.note_special || '');
    }
  }, [initialData]);

  // 載入 SALES/LEADER 清單
  useEffect(() => {
    (async () => {
      try {
        const payload = await handleFindUsersByRoles(['ADMIN', 'SALES', 'LEADER']);
        setSalesLeaders(payload.customers || []);
      } catch (err) {
        console.error('載入銷售/領導清單失敗:', err);
      }
    })();
  }, []);

  // 載入 MEMBER 清單
  useEffect(() => {
    (async () => {
      try {
        const payload = await handleFindUsersByRoles(['MEMBER']);
        setMembers(payload.customers || []);
      } catch (err) {
        console.error('載入會員清單失敗:', err);
      }
    })();
  }, []);

  // 根據 ownerSales（id）決定顯示文字
  useEffect(() => {
    if (!ownerSales) {
      setSalesInput('');
      setOwnerSalesError(null);
      return;
    }
    const u = salesLeaders.find(x => String(x.user_id) === String(ownerSales));
    if (u) {
      setSalesInput(`${u.user_id} - ${u.name} (${u.role})`);
      setOwnerSalesError(null);
    } else {
      setSalesInput(String(ownerSales));
      // 若 ownerSales 有值但不在清單中，提示錯誤
      setOwnerSalesError('此負責銷售 ID 不在銷售/領導清單');
    }
  }, [ownerSales, salesLeaders]);

  // 根據 referrerId（id）決定顯示文字
  useEffect(() => {
    if (!referrerId) {
      setReferrerInput('');
      setReferrerError(null);
      return;
    }
    const u = members.find(x => String(x.user_id) === String(referrerId));
    if (u) {
      setReferrerInput(`${u.user_id} - ${u.name}`);
      setReferrerError(null);
    } else {
      setReferrerInput(String(referrerId));
      setReferrerError('此介紹人 ID 不在會員清單');
    }
  }, [referrerId, members]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mobile || mobile.length !== 8) {
      const msg = '請輸入 8 位數字手機號碼';
      setMobileError(msg);
      alert(msg);
      return;
    }
    // 驗證負責銷售是否有效（若有輸入）
    if (ownerSalesError) {
      alert(ownerSalesError);
      return;
    }
    // 驗證介紹人是否有效（若有輸入）
    if (referrerError) {
      alert(referrerError);
      return;
    }
    const fullMobile = mobile ? `+852 ${mobile}` : '';

    const formData = {
      password,
      name,
      mobile: fullMobile,
      email,
      role,
      source,
      owner_sales: ownerSales,
      referrer: referrerId,
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
            style={{ ...commonSelectStyle, width: '100%' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>
              +852
            </span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 8);
                setMobile(onlyDigits);
                if (onlyDigits === '') {
                  setMobileError(null);
                } else if (onlyDigits.length !== 8) {
                  setMobileError('請輸入 8 位數字的手機號碼');
                } else {
                  setMobileError(null);
                }
              }}
              style={{ flex: 1, padding: 8, borderRadius: '0 4px 4px 0', border: '1px solid #ccc', borderColor: mobileError ? 'red' : '#ccc' }}
              placeholder="請輸入 +852 後 8 位數字"
              required
            />
          </div>
          {mobileError && (
            <small style={{ color: 'red' }}>{mobileError}</small>
          )}
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
            list="sales-leaders"
            value={salesInput}
            onChange={(e) => {
              const val = e.target.value;
              setSalesInput(val);
              const match = salesLeaders.find(u => `${u.user_id} - ${u.name} (${u.role})` === val);
              if (match) {
                setOwnerSales(String(match.user_id));
                setOwnerSalesError(null);
              } else {
                const trimmed = val.trim();
                if (trimmed === '') {
                  setOwnerSales('');
                  setOwnerSalesError(null);
                  return;
                }
                if (/^\d+$/.test(trimmed)) {
                  // 允許直接輸入數字 ID，但需驗證是否存在於清單
                  setOwnerSales(trimmed);
                  const exists = salesLeaders.some(u => String(u.user_id) === trimmed);
                  setOwnerSalesError(exists ? null : '此 ID 不在銷售/領導清單');
                } else {
                  setOwnerSales('');
                  setOwnerSalesError('請輸入銷售 ID（數字），或從清單選擇');
                }
              }
            }}
            placeholder="輸入銷售ID或從清單選擇"
            style={{ width: '100%', padding: 8, borderColor: ownerSalesError ? 'red' : '' }}
          />
          <datalist id="sales-leaders">
            {salesLeaders.map(u => (
              <option key={u.user_id} value={`${u.user_id} - ${u.name} (${u.role})`} />
            ))}
          </datalist>
          {ownerSalesError && (
            <small style={{ color: 'red' }}>{ownerSalesError}</small>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>介紹人:</label><br/>
          <input
            list="member-list"
            value={referrerInput}
            onChange={(e) => {
              const val = e.target.value;
              setReferrerInput(val);
              const match = members.find(u => `${u.user_id} - ${u.name}` === val);
              if (match) {
                setReferrerId(String(match.user_id));
                setReferrerError(null);
              } else {
                const trimmed = val.trim();
                if (trimmed === '') {
                  setReferrerId('');
                  setReferrerError(null);
                  return;
                }
                if (/^\d+$/.test(trimmed)) {
                  // 允許直接輸入數字 ID，但需驗證是否存在於清單
                  setReferrerId(trimmed);
                  const exists = members.some(u => String(u.user_id) === trimmed);
                  setReferrerError(exists ? null : '此 ID 不在會員清單');
                } else {
                  setReferrerId('');
                  setReferrerError('請輸入介紹人 ID（數字），或從清單選擇');
                }
              }
            }}
            placeholder="輸入介紹人ID或從清單選擇"
            style={{ width: '100%', padding: 8, borderColor: referrerError ? 'red' : '' }}
          />
          <datalist id="member-list">
            {members.map(u => (
              <option key={u.user_id} value={`${u.user_id} - ${u.name}`} />
            ))}
          </datalist>
          {referrerError && (
            <small style={{ color: 'red' }}>{referrerError}</small>
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
            <p><strong>創建時間:</strong><br /><u>{formatDateTimeForDisplay(initialData.create_time)}</u></p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button type="submit" style={{ marginRight: 8 }}>
            {submitButtonText}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary" style={{ marginRight: 8 }}>
            取消
          </button>
          {onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(initialData.user_id)} 
              className="btn-danger"
              style={{ marginLeft: 8 }}
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