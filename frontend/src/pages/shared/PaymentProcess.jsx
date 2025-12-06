import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleGetPaymentById, handleUpdatePaymentById } from '../../api/paymentAPI';
import PaymentDetailsTable from '../../components/PaymentDetailsTable';

const statusLabel = (s) => {
	switch ((s||'').toUpperCase()) {
		case 'PENDING': return '待付款';
		case 'COMPLETED': return '已付款';
		case 'EXPIRED': return '已過期';
		case 'CANCELLED': return '已取消';
		default: return s || '-';
	}
};

const PaymentProcess = () => {
	const { paymentId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const userRole = user?.role?.toLowerCase();
	const isAdmin = userRole === 'admin';
	const isSalesOrLeader = userRole === 'sales' || userRole === 'leader';

	const [payment, setPayment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [newStatus, setNewStatus] = useState('');
	const [newMethod, setNewMethod] = useState('');
	const [notes, setNotes] = useState('');
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		// Check permission
		if (!isAdmin && !isSalesOrLeader) {
			alert('您沒有權限處理付款');
			navigate('/payments');
			return;
		}

		// TODO: Load payment details from API
		const loadPayment = async () => {
			try {
				// Placeholder: Replace with actual API call

				const res = await handleGetPaymentById(paymentId);
				setPayment(res.payment);
				
				setNewStatus('COMPLETED');
				setNewMethod(res.payment.method || 'CASH');
			} catch (e) {
				setError(e?.message || '載入失敗');
			} finally {
				setLoading(false);
			}
		};
		loadPayment();
	}, [paymentId, isAdmin, isSalesOrLeader, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!newStatus) {
			alert('請選擇付款狀態');
			return;
		}

		if (window.confirm(`確認要將付款狀態更新為「${statusLabel(newStatus)}」嗎？`)) {
			setProcessing(true);
			try {
				await handleUpdatePaymentById(paymentId, { 
					status: newStatus, 
					method: newMethod, 
					remarks: notes,
					casher_id: user?.id 
				});
				
				alert('付款狀態更新成功！');
				navigate('/payments');
			} catch (e) {
				alert(`更新失敗：${e?.message || '未知錯誤'}`);
			} finally {
				setProcessing(false);
			}
		}
	};

	const handleCancel = () => {
		navigate('/payments');
	};

	const handleRefund = async () => {
		if (window.confirm('確認要退款嗎？此操作將會把付款狀態改為「已退款」。 \n\n退款後，付款狀態將不能更改。')) {
			setProcessing(true);
			try {
				await handleUpdatePaymentById(paymentId, { 
					status: 'REFUNDED', 
					remarks: notes,
					casher_id: user?.id 
				});
				
				alert('退款成功！');
				navigate('/payments');
			} catch (e) {
				alert(`退款失敗：${e?.message || '未知錯誤'}`);
			} finally {
				setProcessing(false);
			}
		}
	};

	if (loading) return <div>載入中...</div>;
	if (error) return <div>錯誤：{error}</div>;
	if (!payment) return <div>找不到付款記錄</div>;

	return (
		<div>
			<h1>處理付款</h1>
			
			<PaymentDetailsTable 
				payment={payment}
				showForm={true}
				showCasher={isAdmin}
				newStatus={newStatus}
				setNewStatus={setNewStatus}
				newMethod={newMethod}
				setNewMethod={setNewMethod}
				notes={notes}
				setNotes={setNotes}
				processing={processing}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
				onRefund={handleRefund}
			/>
		</div>
	);
};

export default PaymentProcess;
