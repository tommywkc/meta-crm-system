import React, { useState, useEffect } from 'react';
import { getMiscExpenses, createMiscExpense, deleteMiscExpense } from '../../api/expensesAPI';
import { handleListEvents } from '../../api/eventListAPI';
import { PageContainer, PageHeader } from '../CommonPage';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';

const MonthlyMiscExpenseReport = ({ onBack }) => {
    const [misc, setMisc] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [filterEventId, setFilterEventId] = useState('all');
    const [expenseDate, setExpenseDate] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewImage, setViewImage] = useState(null);

    useEffect(() => {
        fetchMiscExpenses();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await handleListEvents({ limit: 1000 });
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    const fetchMiscExpenses = async () => {
        setLoading(true);
        try {
            const data = await getMiscExpenses();
            setMisc(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch misc expenses:', error);
            setMisc([]);
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
        if (!expenseDate || !amount) {
            alert('請填寫日期和金額');
            return;
        }

        if (selectedEventId) {
            const selectedEvent = events.find(ev => String(ev.event_id) === String(selectedEventId));
            if (selectedEvent && selectedEvent.datetime_start && selectedEvent.datetime_end) {
                const start = new Date(selectedEvent.datetime_start).setHours(0, 0, 0, 0);
                const end = new Date(selectedEvent.datetime_end).setHours(23, 59, 59, 999);
                const expenseTime = new Date(expenseDate).setHours(12, 0, 0, 0);
                
                if (expenseTime < start || expenseTime > end) {
                    const startStr = new Date(selectedEvent.datetime_start).toLocaleDateString();
                    const endStr = new Date(selectedEvent.datetime_end).toLocaleDateString();
                    alert(`無效時間！\n所選活動的有效日期範圍為：\n${startStr} 至 ${endStr}\n請重新選擇日期。`);
                    return;
                }
            }
        }

        const formData = new FormData();
        if (selectedEventId) {
            formData.append('event_id', selectedEventId);
        }
        formData.append('expense_date', expenseDate);
        formData.append('amount', amount);
        if (description) {
            formData.append('description', description);
        }
        if (file) {
            formData.append('receipt', file);
        }

        try {
            await createMiscExpense(formData);
            alert('新增成功');
            setExpenseDate('');
            setAmount('');
            setDescription('');
            setFile(null);
            document.getElementById('file-input-misc').value = null;
            fetchMiscExpenses();
        } catch (error) {
            console.error('Error creating misc expense:', error);
            const msg = error.response?.data?.error || error.message || '發生錯誤';
            alert('新增失敗: ' + msg);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('確定要刪除此記錄嗎？')) {
            try {
                await deleteMiscExpense(id);
                fetchMiscExpenses();
            } catch (error) {
                console.error('Error deleting misc expense:', error);
                alert('刪除失敗');
            }
        }
    };

    const displayedMisc = misc.filter(p => {
        if (filterEventId === 'all') return true;
        if (filterEventId === 'general') return !p.event_id;
        return String(p.event_id) === String(filterEventId);
    });

    const summary = displayedMisc.reduce((acc, curr) => {
        const dateObj = new Date(curr.expense_date);
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) acc[monthKey] = 0;
        acc[monthKey] += parseFloat(curr.amount);
        return acc;
    }, {});

    return (
        <div style={{ padding: '20px', background: '#fff', minHeight: '80vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ marginRight: '16px', padding: '8px 16px', cursor: 'pointer' }}>
                    &larr; 返回
                </button>
                <h2 style={{ margin: 0 }}>雜費月報表 (Monthly Misc Expenses)</h2>
            </div>
            
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px', background: '#f9f9f9' }}>
                <h3>新增雜費記錄</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>關聯活動 (可選):</label>
                        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
                            <option value="">不指定 (General)</option>
                            {events.map(ev => (
                                <option key={ev.event_id} value={ev.event_id}>#{ev.event_id} - {ev.event_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>日期 (YYYY-MM-DD):</label>
                        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} style={{ padding: '8px' }} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>金額 (HKD):</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '8px', width: '120px' }} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>描述:</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例：辦公用品、水電" style={{ padding: '8px', width: '200px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>上傳單據 (支援各種格式):</label>
                        <input id="file-input-misc" type="file" onChange={handleFileChange} style={{ padding: '8px 0' }} />
                    </div>
                    <button type="submit" style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        提交 (Submit)
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ flex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>詳細記錄表</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label><strong>過濾活動:</strong></label>
                            <select value={filterEventId} onChange={(e) => setFilterEventId(e.target.value)} style={{ padding: '6px' }}>
                                <option value="all">全部記錄 (All)</option>
                                <option value="general">無關聯的一般費用 (General)</option>
                                {events.map(ev => (
                                    <option key={ev.event_id} value={ev.event_id}>#{ev.event_id} - {ev.event_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f0f2f5' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>活動關聯</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>發生日期</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>金額 (HKD)</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>描述</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>單據</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>建立時間</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedMisc.map(p => {
                                const fDate = new Date(p.expense_date);
                                return (
                                    <tr key={p.id}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.id}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.event_id ? `#${p.event_id}` : '-'}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{`${fDate.getFullYear()}-${String(fDate.getMonth()+1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>${parseFloat(p.amount).toFixed(2)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.description || '-'}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                            {p.receipt_url ? (
                                                  <div style={{ display: 'flex', gap: '8px' }}>
                                                      <button onClick={() => setViewImage(p.receipt_url)} style={{ background: 'none', border: '1px solid #1890ff', color: '#1890ff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                                                          預覽
                                                      </button>
                                                      <a href={p.receipt_url} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'none', border: '1px solid #52c41a', color: '#52c41a', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                                                          下載
                                                      </a>
                                                  </div>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{formatDateTimeForDisplay(p.created_at)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                            <button onClick={() => handleDelete(p.id)} style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                                                刪除
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayedMisc.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暫無記錄</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ flex: 1 }}>
                    <h3>月度總結</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f0f2f5' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>月份</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>總計 (HKD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(summary).sort((a,b) => b[0].localeCompare(a[0])).map(([month, total]) => (
                                <tr key={month}>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{month}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>${total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Modal */}
            {viewImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setViewImage(null)}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewImage(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#ccc', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '50%' }}>X</button>
                        <div style={{ marginBottom: '15px' }}>
                            <a href={viewImage} download target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: '#1890ff', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>直接下載文件</a>
                        </div>
                        {viewImage.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                            <iframe src={viewImage} style={{ width: '800px', height: '600px', border: 'none' }} title="Receipt PDF" />
                        ) : viewImage.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/) ? (
                            <img src={viewImage} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ padding: '50px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📄</div>
                                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>這個文件格式（如 Word / Excel 等）不支援在瀏覽器中直接預覽。</p>
                                <p style={{ color: '#666' }}>請點擊上方的「可以直接下載文件」來獲取並查看該文件。</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyMiscExpenseReport;