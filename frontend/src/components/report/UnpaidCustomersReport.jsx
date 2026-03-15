import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../api/apiBase';

const UnpaidCustomersReport = ({ onBack }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('attended'); // 'attended' or 'not_attended'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(apiUrl('/api/reports/unpaid-customers'), {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (!res.ok) throw new Error('Failed to fetch unpaid customers');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter data based on active tab
    const filteredData = data.filter(item => 
        activeTab === 'attended' ? item.attended_seminar : !item.attended_seminar
    );

    // Group by course
    const groupedData = filteredData.reduce((acc, item) => {
        if (!acc[item.course_name]) {
            acc[item.course_name] = [];
        }
        acc[item.course_name].push(item);
        return acc;
    }, {});

    const tabStyle = (isActive) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        borderBottom: isActive ? '3px solid #1976d2' : '3px solid transparent',
        fontWeight: isActive ? 'bold' : 'normal',
        color: isActive ? '#1976d2' : '#666',
        background: 'none',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        fontSize: '1.1rem',
        marginRight: '20px'
    });

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                返回報表中心
            </button>
            
            <h2 style={{ marginBottom: '20px' }}>未付款客人名單</h2>

            <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                <button 
                    style={tabStyle(activeTab === 'attended')} 
                    onClick={() => setActiveTab('attended')}
                >
                    出席過講座名單
                </button>
                <button 
                    style={tabStyle(activeTab === 'not_attended')} 
                    onClick={() => setActiveTab('not_attended')}
                >
                    未出席講座名單
                </button>
            </div>

            {loading && <p>載入中...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && Object.keys(groupedData).length === 0 && (
                <p>沒有符合條件的資料。</p>
            )}

            {!loading && !error && Object.keys(groupedData).map(courseName => (
                <div key={courseName} style={{ marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: '#333' }}>
                        課程: {courseName}
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>姓名</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>電話</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Email</th>
                                {activeTab === 'attended' && (
                                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>出席日期清單</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData[courseName].map((user, idx) => (
                                <tr key={`${user.user_id}-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{user.name}</td>
                                    <td style={{ padding: '12px' }}>{user.mobile}</td>
                                    <td style={{ padding: '12px' }}>{user.email}</td>
                                    {activeTab === 'attended' && (
                                        <td style={{ padding: '12px' }}>{user.attend_dates || '無紀錄'}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default UnpaidCustomersReport;
