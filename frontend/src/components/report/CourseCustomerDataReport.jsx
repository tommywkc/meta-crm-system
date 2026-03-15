import React, { useState, useEffect } from 'react';
import { handleListAllPayment } from '../../api/paymentAPI';
import { tableStyle, thTdStyle, searchInputStyle } from '../../styles/TableStyles';
import { UpperSelectContainerStyle, LowerSelectContainerStyle, commonSelectStyle } from '../../styles/SelectStyles';

const CourseCustomerDataReport = ({ onBack }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedQ, setAppliedQ] = useState('');
    const [lastPageReached, setLastPageReached] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const offset = (page - 1) * limit;
                const res = await handleListAllPayment(limit, offset, appliedQ, [], []);
                const list = Array.isArray(res) ? res : (res.payments || []);
                setPayments(list);
                setLastPageReached(list.length < limit);
            } catch (e) {
                setError(e?.message || '載入失敗');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, limit, appliedQ]);

    const handleSearch = () => {
        setAppliedQ(searchTerm.trim());
        setPage(1);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('zh-HK');
    };

    const getSettlementMonth = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const methodLabel = (m) => {
        switch ((m||'').toUpperCase()) {
            case 'CREDITCARD': return '信用卡';
            case 'FPS': return '轉數快';
            case 'PAYME': return 'PayMe';
            case 'CASH': return '現金';
            default: return m || '-';
        }
    };

    const canPrev = page > 1;
    const canNext = !lastPageReached;

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={onBack} style={{ marginBottom: '16px' }}>返回課程分組</button>
            <h2>課程的客戶資料名單</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
                <input 
                    type="text" 
                    placeholder="輸入[訂單編號/姓名/活動ID/付款方式/狀態]來搜尋." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    style={searchInputStyle}
                />
                <button onClick={handleSearch}>搜尋</button>
                <button onClick={() => { setSearchTerm(''); setAppliedQ(''); setPage(1); }}>清除</button>
            </div>

            {loading && <p>載入中...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && (
                <>
                    <div style={UpperSelectContainerStyle}>
                        <label>
                            頁數:&nbsp;
                            <select value={page} disabled style={commonSelectStyle}>
                                <option value={page}>{page}</option>
                            </select>
                        </label>
                        <label>
                            每頁顯示:&nbsp;
                            <select 
                                value={limit} 
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                style={commonSelectStyle}
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </label>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thTdStyle}>付款日</th>
                                    <th style={thTdStyle}>尾款日</th>
                                    <th style={thTdStyle}>姓名</th>
                                    <th style={thTdStyle}>付款金額</th>
                                    <th style={thTdStyle}>付款手段</th>
                                    <th style={thTdStyle}>電話</th>
                                    <th style={thTdStyle}>找數月</th>
                                    <th style={thTdStyle}>介紹人</th>
                                    <th style={thTdStyle}>負責銷售</th>
                                    <th style={thTdStyle}>收據是否已出</th>
                                    <th style={thTdStyle}>證書是否已出</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.payment_id}>
                                        <td style={thTdStyle}>{formatDate(p.paid_time || p.create_time)}</td>
                                        <td style={thTdStyle}>{formatDate(p.expire_time)}</td>
                                        <td style={thTdStyle}>{p.user_name || '-'}</td>
                                        <td style={thTdStyle}>${p.amount || 0}</td>
                                        <td style={thTdStyle}>{methodLabel(p.method)}</td>
                                        <td style={thTdStyle}>{p.user_mobile || '-'}</td>
                                        <td style={thTdStyle}>{getSettlementMonth(p.paid_time || p.create_time)}</td>
                                        <td style={thTdStyle}>{p.user_referrer_name || '-'}</td>
                                        <td style={thTdStyle}>{p.user_owner_sales_name || '-'}</td>
                                        <td style={thTdStyle}>{p.issued_receipt ? '是' : '否'}</td>
                                        <td style={thTdStyle}>{p.issued_certificate ? '是' : '否'}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan="11" style={{ ...thTdStyle, textAlign: 'center' }}>暫無資料</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={LowerSelectContainerStyle}>
                        <button onClick={() => setPage(p => p - 1)} disabled={!canPrev}>上一頁</button>
                        <span style={{ margin: '0 10px' }}>第 {page} 頁</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={!canNext}>下一頁</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CourseCustomerDataReport;
