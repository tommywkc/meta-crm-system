import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleGetPaymentById } from '../../api/paymentAPI';
import PaymentDetailsTable from '../../components/PaymentDetailsTable';

const PaymentView = () => {
	const { paymentId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const userRole = user?.role?.toLowerCase();
	const isAdmin = userRole === 'admin';
	const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';
	const isMember = userRole === 'member';

	const [payment, setPayment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const loadPayment = async () => {
			try {
				const res = await handleGetPaymentById(paymentId);
				
				// Check permission: member can only view their own payments
				if (isMember && res.payment.user_id !== user.id) {
					alert('您沒有權限查看此付款記錄');
					navigate('/payments');
					return;
				}
				
				setPayment(res.payment);
			} catch (e) {
				setError(e?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};
		loadPayment();
	}, [paymentId, isMember, user, navigate]);

	const handleBack = () => {
		navigate('/payments');
	};

	if (loading) return <div>載入中...</div>;
	if (error) return <div>錯誤：{error}</div>;
	if (!payment) return <div>找不到付款記錄</div>;

	const handleEdit = () => {
		navigate(`/payments/${paymentId}/process`);
	};

	const paymentStatus = payment?.status?.toUpperCase();
	const canEdit = paymentStatus !== 'REFUNDED' && paymentStatus !== 'EXPIRED';

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', marginTop: '20px' }}>
				<button className="btn-secondary" onClick={handleBack} style={{ margin: 0 }}>返回</button>
				<h2 style={{ margin: 0 }}>付款詳情</h2>
			</div>
			
			<PaymentDetailsTable payment={payment} showForm={false} showCasher={isAdmin} />
			
			<br />
			
			{(isAdmin || isSalesOrLeader) && canEdit && (
				<>
					<button onClick={handleEdit}>更改</button>
					{' '}
				</>
			)}
		</div>
	);
};

export default PaymentView;
