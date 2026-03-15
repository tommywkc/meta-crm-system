import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../api/apiBase';
import { handleListEvents } from '../../api/eventListAPI';

const FinancialReport = ({ onBack }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
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

    const handleGenerateReport = async () => {
        if (!selectedCourse || !selectedMonth) {
            setError('請選擇課程和月份');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl(`/api/reports/financial?eventId=${selectedCourse}&monthStr=${selectedMonth}`), {
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
        const promotionCost = Number(reportData.promotion_cost) || 0;
        const roomCost = Number(reportData.room_cost) || 0;
        const salesCommissions = Number(reportData.sales_commissions) || 0;
        const salaryCost = Number(reportData.salary_cost) || 0;
        const miscCost = Number(reportData.misc_cost) || 0;
        const freightCost = Number(reportData.freight_cost) || 0;
        const utilitiesCost = Number(reportData.utilities_cost) || 0;
        const telecomCost = Number(reportData.telecom_cost) || 0;
        const cogCost = Number(reportData.cog_cost) || 0;

        const directExpenses = referralFees + promotionCost + roomCost + salesCommissions + salaryCost + miscCost + freightCost + utilitiesCost + telecomCost + cogCost;
        const grossProfit = netReceived - directExpenses;
        const gpPercentage = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) + '%' : '0.00%';

        return (
            <div style={{ marginTop: '30px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>報表結果</h3>
                
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
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>介紹費</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(referralFees)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>宣傳費</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(promotionCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>租場費</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(roomCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>銷售佣金分成</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(salesCommissions)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>日曆成本 (Salary Cost)</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(salaryCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>雜費 (Misc Cost)</td>
                            <td style={{ padding: '12px', color: '#d32f2f' }}>- {formatCurrency(miscCost)}</td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f9f9f9' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>直接支出 (Total Expenses)</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#d32f2f' }}>- {formatCurrency(directExpenses)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '1.2rem' }}>GP (Gross Profit)</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '1.2rem', color: grossProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>
                                {formatCurrency(grossProfit)}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '1.2rem' }}>GP%</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '1.2rem', color: grossProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>
                                {gpPercentage}
                            </td>
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

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
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
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>選擇找數月 (YYYY-MM)</label>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <button 
                        onClick={handleGenerateReport}
                        disabled={loading}
                        style={{ padding: '10px 24px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                        {loading ? '產生中...' : '產生報表'}
                    </button>
                </div>
            </div>

            {error && <p style={{ color: 'red', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

            {renderReport()}
        </div>
    );
};

export default FinancialReport;
