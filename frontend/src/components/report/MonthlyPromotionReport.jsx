import React, { useState, useEffect } from 'react';
import { getPromotions, createPromotion, deletePromotion } from '../../api/promotionsAPI'; // Create this API file
import { PageContainer, PageHeader } from '../CommonPage';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const MonthlyPromotionReport = ({ onBack }) => {
    const [promotions, setPromotions] = useState([]);
    const [month, setMonth] = useState('');
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewImage, setViewImage] = useState(null);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const data = await getPromotions();
            if (data.success) {
                setPromotions(data.promotions);
            }
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        }
        setLoading(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!month || !amount) {
            alert('請填寫月份和金額');
            return;
        }

        const formData = new FormData();
        formData.append('month_str', month);
        formData.append('amount', amount);
        if (file) {
            formData.append('receipt', file);
        }

        try {
            const res = await createPromotion(formData);
            if (res.success) {
                alert('新增成功');
                
                // Clear inputs
                setMonth('');
                setAmount('');
                setFile(null);
                // Clear the file input visually
                document.getElementById('file-input').value = null;

                fetchPromotions();
            } else {
                alert('新增失敗: ' + res.message);
            }
        } catch (error) {
            console.error('Error creating promotion:', error);
            const msg = error.response?.data?.message || error.message || '發生錯誤';
            alert('新增失敗: ' + msg);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('確定要刪除此記錄嗎？')) {
            try {
                const res = await deletePromotion(id);
                if (res.success) {
                    fetchPromotions();
                } else {
                    alert('刪除失敗');
                }
            } catch (error) {
                console.error('Error deleting promotion:', error);
            }
        }
    };

    // Calculate totals by month
    const summary = promotions.reduce((acc, curr) => {
        if (!acc[curr.month_str]) {
            acc[curr.month_str] = 0;
        }
        acc[curr.month_str] += parseFloat(curr.amount);
        return acc;
    }, {});

    return (
        <div style={{ padding: '20px', background: '#fff', minHeight: '80vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ marginRight: '16px', padding: '8px 16px', cursor: 'pointer' }}>
                    &larr; 返回
                </button>
                <h2 style={{ margin: 0 }}>宣傳費月報表 (Monthly Promotion Expenses)</h2>
            </div>
            
            {/* Input Form */}
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px', background: '#f9f9f9' }}>
                <h3>新增宣傳費記錄</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>月份 (YYYY-MM):</label>
                        <input 
                            type="month" 
                            value={month} 
                            onChange={(e) => setMonth(e.target.value)} 
                            style={{ padding: '8px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>金額 (HKD):</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            style={{ padding: '8px', width: '120px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>單據 (圖片/PDF):</label>
                        <input 
                            id="file-input"
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            style={{ padding: '5px' }}
                        />
                    </div>
                    <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        新增
                    </button>
                </form>
            </div>

            {/* Summary Table */}
            <h3 style={{ marginTop: '30px' }}>月份彙總</h3>
            <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#eee' }}>
                            <th style={thStyle}>月份</th>
                            <th style={thStyle}>總金額 (HKD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(summary).sort().reverse().map(m => (
                            <tr key={m} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={tdStyle}>{m}</td>
                                <td style={tdStyle}>${summary[m].toFixed(2)}</td>
                            </tr>
                        ))}
                        {Object.keys(summary).length === 0 && (
                            <tr><td colSpan="2" style={{ padding: '10px', textAlign: 'center' }}>暫無數據</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail List */}
            <h3>詳細列表</h3>
            {loading ? <p>載入中...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#eee' }}>
                                <th style={thStyle}>月份</th>
                                <th style={thStyle}>金額 (HKD)</th>
                                <th style={thStyle}>備註</th>
                                <th style={thStyle}>單據</th>
                                <th style={thStyle}>上傳時間</th>
                                <th style={thStyle}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={tdStyle}>{p.month_str}</td>
                                    <td style={tdStyle}>${parseFloat(p.amount).toFixed(2)}</td>
                                    <td style={tdStyle}>{p.note || (p.is_manual ? '手動記錄' : '系統自動')}</td>
                                    <td style={tdStyle}>
                                        {p.receipt_url ? (
                                            <a href="#" onClick={(e) => { e.preventDefault(); setViewImage(p.receipt_url); }}>
                                                查看單據
                                            </a>
                                        ) : '無'}
                                    </td>
                                    <td style={tdStyle}>{p.created_at ? formatDateTimeForDisplay(p.created_at) : '-'}</td>
                                    <td style={tdStyle}>
                                        {p.is_manual ? (
                                            <button onClick={() => handleDelete(p.id)} style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>
                                                刪除
                                            </button>
                                        ) : (
                                            <span style={{ color:'#999', fontSize:'0.9em' }}>
                                                (關聯活動)
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {promotions.length === 0 && (
                                <tr><td colSpan="6" style={{ padding: '10px', textAlign: 'center' }}>暫無數據</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Image Modal */}
            {viewImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }} onClick={() => setViewImage(null)}>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', overflow: 'auto' }}>
                        {viewImage.endsWith('.pdf') ? (
                            <iframe src={viewImage} style={{ width: '80vw', height: '80vh' }} title="Receipt PDF"></iframe>
                        ) : (
                            <img src={viewImage} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
                        )}
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <button onClick={() => setViewImage(null)}>關閉</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const thStyle = { padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '10px' };

export default MonthlyPromotionReport;
