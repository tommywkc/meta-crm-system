import React, { useState, useEffect } from 'react';
import { handleListAllPayment } from '../../api/paymentAPI';
import { tableStyle, thTdStyle, searchInputStyle } from '../../styles/TableStyles';
import { UpperSelectContainerStyle, LowerSelectContainerStyle, commonSelectStyle } from '../../styles/SelectStyles';

const CourseCustomerDataReport = ({ onBack }) => {
    const [fullPaymentList, setFullPaymentList] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [lastPageReached, setLastPageReached] = useState(false);

    // 高級篩選狀態
    const [filterName, setFilterName] = useState('');
    const [filterMobile, setFilterMobile] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterReceipt, setFilterReceipt] = useState('');
    const [filterCertificate, setFilterCertificate] = useState('');
    const [filterSalesName, setFilterSalesName] = useState('');

    // 初始加載全部資料
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await handleListAllPayment(999999, 0, '', [], []);
                const list = Array.isArray(res) ? res : (res.payments || []);
                setFullPaymentList(list);
                setPayments(list);
                setLastPageReached(true);
            } catch (e) {
                setError(e?.message || '載入失敗');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // 應用本地篩選邏輯
    useEffect(() => {
        let filtered = fullPaymentList;

        if (filterName.trim()) {
            filtered = filtered.filter(p =>
                (p.user_name || '').toLowerCase().includes(filterName.toLowerCase())
            );
        }

        if (filterMobile.trim()) {
            filtered = filtered.filter(p =>
                (p.user_mobile || '').includes(filterMobile)
            );
        }

        if (filterMethod) {
            filtered = filtered.filter(p => p.method === filterMethod);
        }

        if (filterDateFrom) {
            const fromDate = new Date(filterDateFrom);
            filtered = filtered.filter(p => {
                const paidDate = new Date(p.paid_time || p.create_time);
                return paidDate >= fromDate;
            });
        }

        if (filterDateTo) {
            const toDate = new Date(filterDateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(p => {
                const paidDate = new Date(p.paid_time || p.create_time);
                return paidDate <= toDate;
            });
        }

        if (filterReceipt === 'yes') {
            filtered = filtered.filter(p => p.issued_receipt === true);
        } else if (filterReceipt === 'no') {
            filtered = filtered.filter(p => p.issued_receipt === false);
        }

        if (filterCertificate === 'yes') {
            filtered = filtered.filter(p => p.issued_certificate === true);
        } else if (filterCertificate === 'no') {
            filtered = filtered.filter(p => p.issued_certificate === false);
        }

        if (filterSalesName.trim()) {
            filtered = filtered.filter(p =>
                (p.user_owner_sales_name || '').toLowerCase().includes(filterSalesName.toLowerCase())
            );
        }

        setPayments(filtered);
        setPage(1);
    }, [filterName, filterMobile, filterMethod, filterDateFrom, filterDateTo, filterReceipt, filterCertificate, filterSalesName, fullPaymentList]);

    const handleClearFilters = () => {
        setFilterName('');
        setFilterMobile('');
        setFilterMethod('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterReceipt('');
        setFilterCertificate('');
        setFilterSalesName('');
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
    const canNext = (page * limit) < payments.length;
    const paginatedPayments = payments.slice((page - 1) * limit, page * limit);

    const filterPanelStyle = {
        backgroundColor: '#f9f9f9',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #e0e0e0'
    };

    const filterRowStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '12px'
    };

    const filterInputStyle = {
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'inherit'
    };

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={onBack} style={{ marginBottom: '16px' }}>返回課程分組</button>
            <h2>課程的客戶資料名單</h2>

            {/* 高級篩選面板 */}
            <div style={filterPanelStyle}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>篩選條件</div>

                <div style={filterRowStyle}>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>客戶姓名</span>
                        <input
                            type="text"
                            placeholder="搜尋姓名"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            style={filterInputStyle}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>電話</span>
                        <input
                            type="text"
                            placeholder="搜尋電話"
                            value={filterMobile}
                            onChange={(e) => setFilterMobile(e.target.value)}
                            style={filterInputStyle}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>付款方式</span>
                        <select
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                            style={filterInputStyle}
                        >
                            <option value="">全部</option>
                            <option value="CREDITCARD">信用卡</option>
                            <option value="FPS">轉數快</option>
                            <option value="PAYME">PayMe</option>
                            <option value="CASH">現金</option>
                        </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>付款日期 (從)</span>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            style={filterInputStyle}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>付款日期 (至)</span>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            style={filterInputStyle}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>負責銷售</span>
                        <input
                            type="text"
                            placeholder="搜尋銷售名稱"
                            value={filterSalesName}
                            onChange={(e) => setFilterSalesName(e.target.value)}
                            style={filterInputStyle}
                        />
                    </label>
                </div>

                <div style={filterRowStyle}>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>收據狀態</span>
                        <select
                            value={filterReceipt}
                            onChange={(e) => setFilterReceipt(e.target.value)}
                            style={filterInputStyle}
                        >
                            <option value="">全部</option>
                            <option value="yes">已出</option>
                            <option value="no">未出</option>
                        </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>證書狀態</span>
                        <select
                            value={filterCertificate}
                            onChange={(e) => setFilterCertificate(e.target.value)}
                            style={filterInputStyle}
                        >
                            <option value="">全部</option>
                            <option value="yes">已出</option>
                            <option value="no">未出</option>
                        </select>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                        <button onClick={handleClearFilters} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                            清除所有篩選
                        </button>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                            共找到 {payments.length} 筆記錄
                        </span>
                    </div>
                </div>
            </div>

            {loading && <p>載入中...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && (
                <>
                    <div style={UpperSelectContainerStyle}>
                        <label>
                            頁數:&nbsp;
                            <select value={page} onChange={(e) => setPage(Number(e.target.value))} style={commonSelectStyle}>
                                {Array.from({ length: Math.ceil(payments.length / limit) || 1 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
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
                                    <th style={thTdStyle}>客戶資料</th>
                                    <th style={thTdStyle}>交易資訊</th>
                                    <th style={thTdStyle}>相關日期</th>
                                    <th style={thTdStyle}>負責銷售</th>
                                    <th style={thTdStyle}>處理狀態</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPayments.map(p => (
                                    <tr key={p.payment_id}>
                                        <td style={thTdStyle}>
                                            <div style={{ fontWeight: 'bold' }}>{p.user_name || '-'}</div>
                                            <div style={{ fontSize: '0.9em', color: '#666' }}>{p.user_mobile || '-'}</div>
                                        </td>
                                        <td style={thTdStyle}>
                                            <div style={{ color: '#0066cc', fontWeight: 'bold' }}>${p.amount || 0}</div>
                                            <div style={{ fontSize: '0.9em', color: '#555' }}>{methodLabel(p.method)}</div>
                                        </td>
                                        <td style={thTdStyle}>
                                            <div><span style={{ color: '#888', fontSize: '0.85em' }}>付款:</span> {formatDate(p.paid_time || p.create_time)}</div>
                                            <div><span style={{ color: '#888', fontSize: '0.85em' }}>找數月:</span> {getSettlementMonth(p.paid_time || p.create_time)}</div>
                                            {p.expire_time && (
                                                <div style={{ color: '#e67e22', fontSize: '0.9em', marginTop: '4px' }}>
                                                    <span style={{ color: '#888', fontSize: '0.95em' }}>尾款:</span> {formatDate(p.expire_time)}
                                                </div>
                                            )}
                                        </td>
                                        <td style={thTdStyle}>
                                            <div>{p.user_owner_sales_name || '-'}</div>
                                        </td>
                                        <td style={thTdStyle}>
                                            <div>
                                                <span style={{ color: '#888', fontSize: '0.85em' }}>收據:</span>
                                                <span style={{ marginLeft: '4px', color: p.issued_receipt ? 'green' : '#999' }}>
                                                    {p.issued_receipt ? '已出' : '未出'}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#888', fontSize: '0.85em' }}>證書:</span>
                                                <span style={{ marginLeft: '4px', color: p.issued_certificate ? 'green' : '#999' }}>
                                                    {p.issued_certificate ? '已出' : '未出'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedPayments.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ ...thTdStyle, textAlign: 'center', padding: '20px' }}>暫無資料</td>
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
