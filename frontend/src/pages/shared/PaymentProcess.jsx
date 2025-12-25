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
		case 'REFUNDED': return '已退款';
		case 'OUTSTANDING': return '欠款';
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
	const [paidAmount, setPaidAmount] = useState('');
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
				// 預設已付金額輸入值：
				// - 若 paid_amount 為 0 或未設定，預設為應付金額 amount
				// - 若 paid_amount 不為 0，預設為 amount - paid_amount（剩餘需付金額）
				const totalAmount = Number(res.payment.amount || 0);
				const alreadyPaid = Number(res.payment.paid_amount || 0);
				let defaultPaid = 0;
				if (!alreadyPaid) {
					defaultPaid = totalAmount;
				} else {
					defaultPaid = totalAmount - alreadyPaid;
					if (defaultPaid < 0) defaultPaid = 0;
				}
				setPaidAmount(defaultPaid ? String(defaultPaid) : '');
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

		// 計算本次收款、欠款與找續金額
		const alreadyPaid = Number(payment?.paid_amount || 0);
		const totalAmount = Number(payment?.amount || 0);
		const incomingPaidRaw = paidAmount !== '' ? Number(paidAmount) : 0;
		const outstanding = Math.max(totalAmount - alreadyPaid, 0);
		const incomingPaidCapped = Math.min(incomingPaidRaw, outstanding);
		const changeAmount = Math.max(incomingPaidRaw - outstanding, 0);

		let confirmMessage = `確認要將付款狀態更新為「${statusLabel(newStatus)}」嗎？`;
		if (incomingPaidRaw > 0) {
			confirmMessage += `\n\n應收金額：${outstanding}，本次實收：${incomingPaidRaw}`;
			if (changeAmount > 0) {
				confirmMessage += `\n找續金額：${changeAmount}（系統只會記錄已收 ${incomingPaidCapped}）`;
			}
		}

		if (window.confirm(confirmMessage)) {
			setProcessing(true);
			try {
					// 若本次收款金額大於欠款金額，就以欠款金額為上限
					const incomingPaid = incomingPaidCapped;
					const newPaidAmount = incomingPaid ? alreadyPaid + incomingPaid : alreadyPaid;

				await handleUpdatePaymentById(paymentId, { 
					status: newStatus, 
					method: newMethod, 
					paid_amount: newPaidAmount,
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
				paidAmount={paidAmount}
				setPaidAmount={setPaidAmount}
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
