import React, { useState, useEffect } from 'react';
import { PageContainer, PageHeader } from '../CommonPage'; // Adjust path if needed
import { apiUrl } from '../../api/apiBase'; 
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const CourseInfoSummary = ({ onBack }) => {
    // const { token } = useAuth(); // Token is handled by cookies
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl('/api/reports/course-sessions'), {
                // headers: { 'Authorization': `Bearer ${token}` }, // Use credentials instead
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch course summary');
            const data = await res.json();
            setCourses(data.items || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleEditClick = (course) => {
        setEditingId(course.event_id);
        setEditValue(course.room_cost !== null ? course.room_cost : '');
    };

    const handleSaveClick = async (eventId) => {
        try {
            const val = parseFloat(editValue);
            const payload = { room_cost: isNaN(val) ? null : val };

            const res = await fetch(apiUrl(`/api/reports/course-sessions/${eventId}/rent`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Update failed');
            }

            // Update local state
            setCourses(prev => prev.map(c => 
                c.event_id === eventId ? { ...c, room_cost: payload.room_cost } : c
            ));
            setEditingId(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditValue('');
    };

    const filteredCourses = courses.filter(c => filterType === 'ALL' || c.type === filterType);
    const totalRent = filteredCourses.reduce((sum, c) => sum + (parseFloat(c.room_cost) || 0), 0);
    const pendingRent = filteredCourses.filter(c => c.room_cost === null || c.room_cost === undefined).length;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ marginRight: '16px', padding: '8px 16px', cursor: 'pointer' }}>
                    &larr; 返回
                </button>
                <h2 style={{ margin: 0 }}>講座及課堂資訊總表</h2>
            </div>
            
            {loading && <p>載入中...</p>}
            {error && <p style={{ color: 'red' }}>錯誤: {error}</p>}

            {!loading && !error && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>當前清單總租場費用:</strong> ${totalRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (未記錄: {pendingRent} 筆)</p>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <span>篩選:</span>
                            <label>
                                <input type="radio" checked={filterType === 'ALL'} onChange={() => setFilterType('ALL')} /> 全部 ({courses.length})
                            </label>
                            <label>
                                <input type="radio" checked={filterType === 'SEMINAR'} onChange={() => setFilterType('SEMINAR')} /> 講座 ({courses.filter(c => c.type === 'SEMINAR').length})
                            </label>
                            <label>
                                <input type="radio" checked={filterType === 'CLASS'} onChange={() => setFilterType('CLASS')} /> 課堂 ({courses.filter(c => c.type === 'CLASS').length})
                            </label>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={thStyle}>活動名稱 / 類型</th>
                                <th style={thStyle}>日期 / 時間</th>
                                <th style={thStyle}>地點</th>
                                <th style={thStyle}>租場費用 (HKD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map(course => {
                                const hasSessions = course.sessions && course.sessions.length > 0;
                                const firstSession = hasSessions ? course.sessions[0] : null;
                                const lastSession = hasSessions ? course.sessions[course.sessions.length - 1] : null;

                                return (
                                    <tr key={course.event_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 'bold' }}>{course.event_name}</div>
                                            <div style={{ fontSize: '0.85em', color: '#666' }}>
                                                {course.type === 'SEMINAR' ? '講座' : '課堂'} 
                                                <span style={{ marginLeft: 8 }}>ID: {course.event_id}</span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            {hasSessions ? (
                                                <div>
                                                    {firstSession === lastSession ? (
                                                        <span>
                                                            {formatDateTimeForDisplay(firstSession.datetime_start).split(' ')[0]}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                           {formatDateTimeForDisplay(firstSession.datetime_start).split(' ')[0]} 
                                                           {' 至 '} 
                                                           {formatDateTimeForDisplay(lastSession.datetime_start).split(' ')[0]}
                                                        </span>
                                                    )}
                                                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                                                        共 {course.sessions.length} 堂課
                                                    </div>
                                                    <details style={{ marginTop: '5px', cursor: 'pointer', fontSize:'0.85em' }}>
                                                        <summary>查看詳細時間</summary>
                                                        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                                                            {course.sessions.map(s => (
                                                                <li key={s.session_id} style={{ marginBottom: 4 }}>
                                                                    {formatDateTimeForDisplay(s.datetime_start)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                </div>
                                            ) : (
                                                <div>
                                                    {course.event_datetime_start 
                                                        ? formatDateTimeForDisplay(course.event_datetime_start) 
                                                        : <span style={{color: '#999'}}>未定</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            {course.location || <span style={{color: '#999'}}>未定</span>}
                                        </td>
                                        <td style={tdStyle}>
                                            {editingId === course.event_id ? (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <input 
                                                        type="number" 
                                                        value={editValue} 
                                                        onChange={e => setEditValue(e.target.value)}
                                                        style={{ width: '80px', padding: 4 }}
                                                    />
                                                    <button onClick={() => handleSaveClick(course.event_id)} style={{ padding: '2px 6px', cursor: 'pointer' }}>保存</button>
                                                    <button onClick={handleCancelClick} style={{ padding: '2px 6px', cursor: 'pointer' }}>取消</button>
                                                </div>
                                            ) : (
                                                <div 
                                                    onClick={() => handleEditClick(course)}
                                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                                    title="點擊編輯"
                                                >
                                                    {course.room_cost !== null && course.room_cost !== undefined ? (
                                                        <span>
                                                            ${course.room_cost} <span style={{ fontSize: '0.8em', color: '#999' }}>✏️</span>
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.9em', color: '#0066cc', textDecoration: 'underline' }}>
                                                            [+] 記錄費用
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filteredCourses.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>暫無資料</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#444'
};

const tdStyle = {
    padding: '12px 16px',
    verticalAlign: 'top'
};

export default CourseInfoSummary;
