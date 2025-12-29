import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListPaymentByUserId, handleListAllPayment } from '../../api/paymentAPI';
import PaymentTable from '../../components/PaymentTable';
import { UpperSelectContainerStyle, LowerSelectContainerStyle } from '../../styles/SelectStyles';
import { searchInputStyle } from '../../styles/TableStyles';


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
	const [methodFilter, setMethodFilter] = useState('');
	const [appliedMethod, setAppliedMethod] = useState('');
	const [statusFilter, setStatusFilter] = useState([]);
	const [appliedStatus, setAppliedStatus] = useState([]);
	const [lastPageReached, setLastPageReached] = useState(false);

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

	return (
		<div style={{ padding: 20 }}>
			<h1>付款紀錄</h1>

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && (
				<>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 }}>
						<input 
							type="text" 
							placeholder="輸入[訂單編號/姓名/活動ID/付款方式/狀態]來搜尋..." 
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
							style={searchInputStyle}
						/>
						<select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} style={{ height: 32 }}>
							<option value="">全部付款方式</option>
							<option value="CREDITCARD">信用卡</option>
							<option value="FPS">轉數快</option>
							<option value="PAYME">PayMe</option>
							<option value="CASH">現金</option>
						</select>
							{/* status filters */}
							<div style={{ display: 'flex', gap: 8 }}>
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
						<button onClick={handleSearch}>
							搜尋
						</button>
						<button onClick={() => { setSearchTerm(''); setAppliedQ(''); setPage(1); }}>
							清除
						</button>
					</div>

					<div style={UpperSelectContainerStyle}>
						<label>
							頁數: &nbsp; {page}
						</label>

						<label>
							每頁付款數量:&nbsp;
							<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
								<option value={25}>25</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</label>
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
		</div>
	);
};

export default Payments;
