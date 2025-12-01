import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleListPaymentByUserId, handleListAllPayment } from '../../api/paymentAPI';
import PaymentTable from '../../components/PaymentTable';

const currency = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 });

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
		alert(`查看收據（模擬）\n編號：${p.payment_id}\n金額：${currency.format(Number(p.amount||0))}`);
	};
	const onDownload = (p) => {
		alert(`下載收據（模擬）: ${p.receipt_number || '暫無'}`);
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>付款紀錄</h1>

			{loading && <p>載入中...</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && (
				<PaymentTable 
					payments={payments}
					onView={onView}
					onDownload={onDownload}
					showUserColumn={isAdmin || isSalesOrLeader}
				/>
			)}
		</div>
	);
};

export default Payments;
