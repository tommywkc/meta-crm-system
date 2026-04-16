import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../api/apiBase';
import { handleListEvents } from '../../api/eventListAPI';

const FinancialReport = ({ onBack }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [activeMonths, setActiveMonths] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await handleListEvents({ type: 'CLASS', limit: 1000 });
                setCourses(res.events || []);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        if (!selectedCourse) {
            setActiveMonths([]);
            setSelectedMonth('');
            setReportData(null);
            return;
        }

        const fetchActiveMonths = async () => {
            try {
                const res = await fetch(apiUrl(`/api/reports/financial/active-months?eventId=${selectedCourse}`), {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setActiveMonths(data.months || []);
                }
            } catch (err) {
                console.error('Failed to fetch active months:', err);
            }
        };

        fetchActiveMonths();
    }, [selectedCourse]);

    const handleGenerateReport = async (month) => {
        const targetMonth = month || selectedMonth;
        if (!selectedCourse || !targetMonth) {
            setError('請選擇課程和月份');
            return;
        }
        setSelectedMonth(targetMonth);
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl(`/api/reports/financial?eventId=${selectedCourse}&monthStr=${targetMonth}`), {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch financial report');
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        const num = Number(val) || 0;
        return `$${num.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const renderReport = () => {
        if (!reportData) return null;

        const totalSales = Number(reportData.total_sales) || 0;
        const paymentFees = Number(reportData.payment_fees) || 0;
        const netReceived = totalSales - paymentFees;
        
        const referralFees = Number(reportData.referral_fees) || 0;
        
        const monthPromotionCost = Number(reportData.month_promotion_cost) || 0;
        const totalPromotionCost = Number(reportData.total_promotion_cost) || 0;

        const roomCost = Number(reportData.room_cost) || 0;
        
        const monthMiscCost = Number(reportData.month_misc_cost) || 0;
        const totalMiscCost = Number(reportData.total_misc_cost) || 0;

        const directExpenses = monthPromotionCost + roomCost + monthMiscCost;
        
        return (
            <div style={{ marginTop: '30px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>報表結果 - {selectedMonth}</h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.1rem' }}>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', width: '40%' }}>當月收生情況</td>
                            <td style={{ padding: '12px' }}>{reportData.enrollment_count} 人</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>銷售總額（按找數月）</td>
                            <td style={{ padding: '12px', color: '#2e7d32' }}>{formatCurrency(totalSales)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>各支付手續費</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(paymentFees)}</td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f9f9f9' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>當月實收</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#1976d2' }}>{formatCurrency(netReceived)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                當月宣傳費支出 <br/>
                                <span style={{ fontSize: '0.85rem', color: '#757575', fontWeight: 'normal' }}>(該活動總宣傳費: {formatCurrency(totalPromotionCost)})</span>
                            </td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(monthPromotionCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>租場費 (總計)</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(roomCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                當月雜費支出 (Misc Cost) <br/>
                                <span style={{ fontSize: '0.85rem', color: '#757575', fontWeight: 'normal' }}>(該活動總雜費: {formatCurrency(totalMiscCost)})</span>
                            </td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(monthMiscCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f9f9f9' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>當月直接支出 (Total Month Expenses)</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#d32f2f' }}>- {formatCurrency(directExpenses)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                返回報表中心
            </button>
            
            <h2 style={{ marginBottom: '20px' }}>財務報表</h2>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px', background: '#f5f5f5', padding: '20px', borderRadius: '8px', minHeight: '100px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>選擇課程</label>
                    <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">-- 請選擇課程 --</option>
                        {courses.map(c => (
                            <option key={c.event_id} value={c.event_id}>{c.event_name}</option>
                        ))}
                    </select>
                </div>
                
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>有費用/收生記錄的月份 (直接點擊查看)</label>
                    {selectedCourse ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {activeMonths.length > 0 ? (
                                activeMonths.map(month => (
                                    <button
                                        key={month}
                                        onClick={() => handleGenerateReport(month)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: selectedMonth === month ? '2px solid #1976d2' : '1px solid #ccc',
                                            backgroundColor: selectedMonth === month ? '#e3f2fd' : '#fff',
                                            color: selectedMonth === month ? '#1976d2' : '#333',
                                            cursor: 'pointer',
                                            fontWeight: selectedMonth === month ? 'bold' : 'normal',
                                            transition: 'all 0.2s',
                                            boxShadow: selectedMonth === month ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {month}
                                    </button>
                                ))
                            ) : (
                                <span style={{ color: '#757575', padding: '8px 0' }}>該活動暫無任何財務或收生記錄</span>
                            )}
                        </div>
                    ) : (
                        <span style={{ color: '#757575', padding: '8px 0' }}>請先選擇課程</span>
                    )}
                </div>
            </div>

            {error && <p style={{ color: 'red', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

            {renderReport()}
        </div>
    );
};

export default FinancialReport;
