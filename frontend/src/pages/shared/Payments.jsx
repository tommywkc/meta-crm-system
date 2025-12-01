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

	useEffect(() => {
		const load = async () => {
			if (!user?.id) { setLoading(false); return; }
			try {
                if (!isMember && !isSalesOrLeader && !isAdmin) {
                    alert('您沒有權限查看此頁面');
                    navigate('/');
                    return;
                }
                if (!isSalesOrLeader && !isAdmin) {
                    const res = await handleListPaymentByUserId(user.id);
                    const list = Array.isArray(res) ? res : (res.payments || []);
                    setPayments(list);
                } else {
                    // For Sales, Leader, Admin: load all payments
                    const res = await handleListAllPayment(100, 0);
                    const list = Array.isArray(res) ? res : (res.payments || []);
                    setPayments(list);
                }
			} catch (e) {
				setError(e?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [user?.id]);

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
		console.log('Searching for:', searchTerm);
		// TODO: 實作搜尋邏輯
	};

	// Pagination logic
	const startIndex = (page - 1) * limit;
	const pagedPayments = payments.slice(startIndex, startIndex + limit);
	const totalPages = Math.max(1, Math.ceil(payments.length / limit));
	const canPrev = page > 1;
	const canNext = page < totalPages;

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
						<button onClick={handleSearch}>
							搜尋
						</button>
					</div>

					<div style={UpperSelectContainerStyle}>
						<label>
							頁數:&nbsp;
							<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
								{Array.from({ length: totalPages }, (_, i) => (
									<option key={i + 1} value={i + 1}>{i + 1}</option>
								))}
							</select>
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
							<label>
								頁數:&nbsp;
								<select value={page} onChange={(e) => setPage(Number(e.target.value))}>
									{Array.from({ length: totalPages }, (_, i) => (
										<option key={i + 1} value={i + 1}>{i + 1}</option>
									))}
								</select>
							</label>
							<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canPrev}>
								上一頁
							</button>
							<button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!canNext}>
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
