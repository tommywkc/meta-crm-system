import React, { useState, useEffect, useCallback } from 'react';
import { getPromotions, createPromotion, deletePromotion, getMiscExpenses, createMiscExpense, deleteMiscExpense } from '../api/expensesAPI';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';

const EventExpenseList = ({ eventId, expenseType, onTotalChange, readOnly = false }) => {
    const [expenses, setExpenses] = useState([]);
    const [expenseDate, setExpenseDate] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewImage, setViewImage] = useState(null);

    const isPromotion = expenseType === 'promotions';
    const label = isPromotion ? '宣傳費' : '雜費';

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const data = isPromotion ? await getPromotions(eventId) : await getMiscExpenses(eventId);
            const arrayData = Array.isArray(data) ? data : [];
            setExpenses(arrayData);
            
            // Calculate total and notify parent
            const total = arrayData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
            if (onTotalChange) {
                onTotalChange(total);
            }
        } catch (error) {
            console.error(`Failed to fetch ${label}:`, error);
            setExpenses([]);
        }
        setLoading(false);
    }, [eventId, isPromotion, label, onTotalChange]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

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

        const formData = new FormData();
        formData.append('event_id', eventId);
        formData.append('expense_date', expenseDate);
        formData.append('amount', amount);
        if (description) {
            formData.append('description', description);
        }
        if (file) {
            formData.append('receipt', file);
        }

        try {
            if (isPromotion) {
                await createPromotion(formData);
            } else {
                await createMiscExpense(formData);
            }
            alert('新增成功');
            setExpenseDate('');
            setAmount('');
            setDescription('');
            setFile(null);
            document.getElementById(`file-input-${expenseType}`).value = null;
            fetchExpenses();
        } catch (error) {
            console.error(`Error creating ${label}:`, error);
            const msg = error.response?.data?.error || error.message || '發生錯誤';
            alert(`新增失敗: ${msg}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('確定要刪除此記錄嗎？對應的活動總額將會自動減少。')) {
            try {
                if (isPromotion) {
                    await deletePromotion(id);
                } else {
                    await deleteMiscExpense(id);
                }
                fetchExpenses();
            } catch (error) {
                console.error(`Error deleting ${label}:`, error);
                alert('刪除失敗');
            }
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            {!readOnly && (
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', background: '#f9f9f9' }}>
                    <h4 style={{ marginTop: 0 }}>新增{label}記錄</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={`例：特定${label}用作...`} style={{ padding: '8px', width: '200px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>單據 (圖片/PDF):</label>
                            <input id={`file-input-${expenseType}`} type="file" onChange={handleFileChange} style={{ padding: '8px 0' }} />
                        </div>
                        <button type="submit" style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            提交 (Submit)
                        </button>
                    </form>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#f0f2f5' }}>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>發生日期</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>金額 (HKD)</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>描述</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>單據</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>建立時間</th>
                        {!readOnly && <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>操作</th>}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={readOnly ? "6" : "7"} style={{ padding: '20px', textAlign: 'center' }}>載入中...</td></tr>
                    ) : expenses.map(p => {
                        const fDate = new Date(p.expense_date);
                        return (
                            <tr key={p.id}>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.id}</td>
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
                                {!readOnly && (
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                        <button onClick={() => handleDelete(p.id)} style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                                            刪除
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                    {!loading && expenses.length === 0 && (
                        <tr>
                            <td colSpan={readOnly ? "6" : "7"} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暫無記錄</td>
                        </tr>
                    )}
                </tbody>
            </table>

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

export default EventExpenseList;   