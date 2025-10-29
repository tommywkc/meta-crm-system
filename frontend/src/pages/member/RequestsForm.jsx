import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RequestsForm = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: '覆課', courseId: '', courseName: '', session: '', requestedDate: '', note: '' });

  const handleFormChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((res) => setTimeout(res, 600));
    const newReq = {
      id: `RQ${Math.floor(Math.random() * 9000) + 1000}`,
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: form.type,
      courseId: form.courseId || 'C-UNK',
      courseName: form.courseName || '未知課程',
      session: form.session,
      requestedDate: form.requestedDate,
      status: '待處理',
      note: form.note
    };
    setSaving(false);
    // navigate back to list and pass the created request via state
    navigate('/requests', { state: { newRequest: newReq } });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>新增申請</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 700 }}>
        <div style={{ marginBottom: 8 }}>
          <label>類型</label>
          <br />
          <select value={form.type} onChange={(e) => handleFormChange('type', e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option>覆課</option>
            <option>補堂</option>
            <option>請假</option>
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>課程號碼</label>
          <br />
          <input value={form.courseId} onChange={(e) => handleFormChange('courseId', e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>課程名稱</label>
          <br />
          <input value={form.courseName} onChange={(e) => handleFormChange('courseName', e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>場次</label>
          <br />
          <input value={form.session} onChange={(e) => handleFormChange('session', e.target.value)} style={{ width: '100%', padding: 8 }} placeholder='例如：第3堂' />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>申請日期</label>
          <br />
          <input value={form.requestedDate} onChange={(e) => handleFormChange('requestedDate', e.target.value)} style={{ width: '100%', padding: 8 }} placeholder='YYYY-MM-DD 或 YYYY-MM-DD HH:mm' />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>備註</label>
          <br />
          <textarea value={form.note} onChange={(e) => handleFormChange('note', e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type='submit' disabled={saving} style={{ marginRight: 8 }}>{saving ? '儲存中…' : '儲存'}</button>
          <button type='button' onClick={() => navigate(-1)}>取消</button>
        </div>
      </form>
    </div>
  );
};

export default RequestsForm;
