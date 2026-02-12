import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListPaymentByUserId, handleListAllPayment } from '../../api/paymentAPI';
import PaymentTable from '../../components/PaymentTable';
import { UpperSelectContainerStyle, LowerSelectContainerStyle, commonSelectStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';
import { PageContainer, PageHeader } from '../../components/CommonPage';


const Payments = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const userRole = user?.role?.toLowerCase();
	const isAdmin = userRole === 'admin';
	const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
	const isMember = userRole === 'member';

	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);
	const [searchTerm, setSearchTerm] = useState('');
	const [appliedQ, setAppliedQ] = useState('');
	const [methodFilter, setMethodFilter] = useState([]);
	const [appliedMethod, setAppliedMethod] = useState([]);
	const [statusFilter, setStatusFilter] = useState([]);
	const [appliedStatus, setAppliedStatus] = useState([]);
	const [lastPageReached, setLastPageReached] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);

	// Fetch page whenever user, page, limit, or appliedQ changes
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);
			if (!user?.id) { setLoading(false); return; }
			try {
				const offset = (page - 1) * limit;
				if (!isSalesOrLeader && !isAdmin) {
					// member: only fetch own completed payments (backend enforces)
					const res = await handleListPaymentByUserId(user.id, { limit, offset, q: appliedQ, method: appliedMethod, status: appliedStatus });
					const list = Array.isArray(res) ? res : (res.payments || []);
					setPayments(list);
					setLastPageReached(list.length < limit);
				} else {
					const res = await handleListAllPayment(limit, offset, appliedQ, appliedMethod, appliedStatus);
					const list = Array.isArray(res) ? res : (res.payments || []);
					setPayments(list);
					setLastPageReached(list.length < limit);
				}
			} catch (e) {
				setError(e?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [user?.id, page, limit, appliedQ, appliedMethod, appliedStatus]);

	const onView = (p) => {
		navigate(`/payments/${p.payment_id}`);
	};
	
	const onDownload = (p) => {
		alert(`下載收據（模擬）: ${p.receipt_number || '暫無'}`);
	};

	const onProcess = (p) => {
		navigate(`/payments/${p.payment_id}/process`);
	};

	const handleSearch = () => {
		// Apply search only when user clicks 搜尋 or presses Enter
		setAppliedQ(searchTerm.trim());
		setAppliedMethod(methodFilter);
		setAppliedStatus(statusFilter);
		setPage(1);
	};

	// Pagination logic: backend-driven pages. payments contains current page
	const pagedPayments = payments;
	const canPrev = page > 1;
	const canNext = !lastPageReached;
    const startIndex = (page - 1) * limit;

	return (
		<PageContainer>
			<PageHeader title="付款紀錄" />

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

		{!loading && !error && (
			<>
				{/* Search input matched to EventList layout */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
					<input 
						type="text" 
						placeholder="輸入[訂單編號/姓名/活動ID/付款方式/狀態]來搜尋." 
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
						style={searchInputStyle}
					/>
					<button onClick={handleSearch}>
						搜尋
					</button>
					<button onClick={() => { setSearchTerm(''); setAppliedQ(''); setPage(1); }}>
						清除
					</button>
                    <button 
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        title="篩選條件"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '4px 8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#093e73',
                            cursor: 'pointer'
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                    </button>
                    {/* Note: Total count not available from backend API for payments yet */}
				</div>

				{/* Filter list */}
                {filtersOpen && (
				<div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        {/* Method filters */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 6 }}>付款方式</div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={methodFilter.includes('CREDITCARD')} onChange={(e) => {
                                        if (e.target.checked) setMethodFilter(prev => [...prev, 'CREDITCARD']); else setMethodFilter(prev => prev.filter(x => x !== 'CREDITCARD'));
                                    }} /> 信用卡
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={methodFilter.includes('FPS')} onChange={(e) => {
                                        if (e.target.checked) setMethodFilter(prev => [...prev, 'FPS']); else setMethodFilter(prev => prev.filter(x => x !== 'FPS'));
                                    }} /> 轉數快
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={methodFilter.includes('PAYME')} onChange={(e) => {
                                        if (e.target.checked) setMethodFilter(prev => [...prev, 'PAYME']); else setMethodFilter(prev => prev.filter(x => x !== 'PAYME'));
                                    }} /> PayMe
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={methodFilter.includes('CASH')} onChange={(e) => {
                                        if (e.target.checked) setMethodFilter(prev => [...prev, 'CASH']); else setMethodFilter(prev => prev.filter(x => x !== 'CASH'));
                                    }} /> 現金
                                </label>
                            </div>
                        </div>

                        {/* Status filters */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 6 }}>付款狀態</div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={statusFilter.includes('COMPLETED')} onChange={(e) => {
                                        if (e.target.checked) setStatusFilter(prev => [...prev, 'COMPLETED']); else setStatusFilter(prev => prev.filter(x => x !== 'COMPLETED'));
                                    }} /> 已付款
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={statusFilter.includes('PENDING')} onChange={(e) => {
                                        if (e.target.checked) setStatusFilter(prev => [...prev, 'PENDING']); else setStatusFilter(prev => prev.filter(x => x !== 'PENDING'));
                                    }} /> 待付款
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={statusFilter.includes('EXPIRED')} onChange={(e) => {
                                        if (e.target.checked) setStatusFilter(prev => [...prev, 'EXPIRED']); else setStatusFilter(prev => prev.filter(x => x !== 'EXPIRED'));
                                    }} /> 已過期
                                </label>
                            </div>
                        </div>
				</div>
                )}

				<div style={UpperSelectContainerStyle}>
                    <label>
                        頁數:&nbsp;
                        <select 
                            value={page} 
                            disabled
                            style={commonSelectStyle}
                        >
                            <option value={page}>{page}</option>
                        </select>
                    </label>

                    <label>
                        每頁付款數量:&nbsp;
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

                    <span style={{ marginLeft: '20px', color: '#666', fontSize: '14px' }}>
                        顯示 {payments.length > 0 ? startIndex + 1 : 0}-{startIndex + payments.length} 筆
                    </span>
				</div>

					<PaymentTable 
						payments={pagedPayments}
						onView={onView}
						onDownload={onDownload}
						onProcess={onProcess}
						showUserColumn={isAdmin || isSalesOrLeader}
					/>

					<div style={LowerSelectContainerStyle}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label>
                                頁數:&nbsp;
                                <select 
                                    value={page} 
                                    disabled
                                    style={commonSelectStyle}
                                >
                                    <option value={page}>{page}</option>
                                </select>
                            </label>
							<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canPrev}>
								上一頁
							</button>
							<button onClick={() => setPage(p => p + 1)} disabled={!canNext}>
								下一頁
							</button>
						</div>
					</div>
				</>
			)}
		</PageContainer>
	);
};

export default Payments;
