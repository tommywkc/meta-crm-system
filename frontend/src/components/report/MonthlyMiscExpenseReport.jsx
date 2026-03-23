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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        fetchMiscExpenses(filterEventId);
    }, [filterEventId]);

    const fetchEvents = async () => {
        try {
            const data = await handleListEvents({ limit: 1000 });
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    const fetchMiscExpenses = async (filterVal = 'all') => {
        setLoading(true);
        try {
            let data;
            if (filterVal === 'general') {
                data = await getMiscExpenses(null, null, true);
            } else if (filterVal && filterVal !== 'all') {
                data = await getMiscExpenses(filterVal);
            } else {
                data = await getMiscExpenses();
            }
            setMisc(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch misc expenses:', error);
            setMisc([]);
        }
        setLoading(false);
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

        const payload = {
            expense_date: expenseDate,
            amount: amount,
            description: description
        };
        if (selectedEventId) {
            payload.event_id = selectedEventId;
        }

        try {
            await createMiscExpense(payload);
            alert('新增成功');
            setExpenseDate('');
            setAmount('');
            setDescription('');
            fetchMiscExpenses(filterEventId);
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
                fetchMiscExpenses(filterEventId);
            } catch (error) {
                console.error('Error deleting misc expense:', error);
                alert('刪除失敗');
            }
        }
    };

    const selectedEventForDate = selectedEventId ? events.find(ev => String(ev.event_id) === String(selectedEventId)) : null;
    const dateMin = selectedEventForDate?.datetime_start
        ? new Date(selectedEventForDate.datetime_start).toISOString().split('T')[0]
        : '';
    const dateMax = selectedEventForDate?.datetime_end
        ? new Date(selectedEventForDate.datetime_end).toISOString().split('T')[0]
        : '';

    const displayedMisc = misc;

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
                        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} min={dateMin || undefined} max={dateMax || undefined} style={{ padding: '8px' }} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>金額 (HKD):</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '8px', width: '120px' }} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>描述:</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例：辦公用品、水電" style={{ padding: '8px', width: '200px' }} />
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
                                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暫無記錄</td>
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
        </div>
    );
};

export default MonthlyMiscExpenseReport;