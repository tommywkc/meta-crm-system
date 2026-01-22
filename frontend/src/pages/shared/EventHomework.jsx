import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const buildDatetimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const EventHomework = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [assignments, setAssignments] = useState([
    {
      assignment_id: 1,
      name: '功課 1：課後練習',
      description: '完成第 1 章練習題，並提交 PDF。',
      deadline: '2026-01-30T18:00'
    },
    {
      assignment_id: 2,
      name: '功課 2：實作作業',
      description: '用所學內容完成一個小專案。',
      deadline: '2026-02-05T23:59'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', deadline: '' });

  const nextId = useMemo(() => {
    if (!assignments.length) return 1;
    return Math.max(...assignments.map((a) => a.assignment_id)) + 1;
  }, [assignments]);

  const handleOpenModal = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        name: assignment.name || '',
        description: assignment.description || '',
        deadline: buildDatetimeLocal(assignment.deadline)
      });
    } else {
      setEditingAssignment(null);
      setFormData({ name: '', description: '', deadline: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline || ''
    };

    if (editingAssignment) {
      setAssignments((prev) =>
        prev.map((item) =>
          item.assignment_id === editingAssignment.assignment_id
            ? { ...item, ...payload }
            : item
        )
      );
    } else {
      setAssignments((prev) => [
        { assignment_id: nextId, ...payload },
        ...prev
      ]);
    }
    handleCloseModal();
  };

  const handleDelete = (assignmentId) => {
    if (!window.confirm('確認要刪除此功課？')) return;
    setAssignments((prev) => prev.filter((item) => item.assignment_id !== assignmentId));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>功課</h1>
      <p>活動 ID: {id || 'N/A'}</p>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => handleOpenModal()}>新增功課</button>
        <button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>返回上一頁</button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>ID</th>
            <th style={thTdStyle}>名稱</th>
            <th style={thTdStyle}>描述</th>
            <th style={thTdStyle}>截止日期</th>
            <th style={thTdStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {assignments.length === 0 ? (
            <tr>
              <td style={thTdStyle} colSpan={5}>暫無功課</td>
            </tr>
          ) : (
            assignments.map((item) => (
              <tr key={item.assignment_id}>
                <td style={thTdStyle}>{item.assignment_id}</td>
                <td style={thTdStyle}>{item.name}</td>
                <td style={thTdStyle}>
                  <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{item.description}</pre>
                </td>
                <td style={thTdStyle}>
                  {item.deadline ? formatDateTimeForDisplay(item.deadline) : 'N/A'}
                </td>
                <td style={thTdStyle}>
                  <button onClick={() => handleOpenModal(item)} style={{ marginRight: 8 }}>編輯</button>
                  <button onClick={() => handleDelete(item.assignment_id)} style={{ color: 'red' }}>刪除</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 420 }}>
            <h2>{editingAssignment ? '編輯功課' : '新增功課'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label>
                  名稱
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', marginTop: 6 }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>
                  描述
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', minHeight: 80, marginTop: 6 }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>
                  截止日期
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{ width: '100%', marginTop: 6 }}
                  />
                </label>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={handleCloseModal} style={{ marginRight: 8 }}>取消</button>
                <button type="submit">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventHomework;
