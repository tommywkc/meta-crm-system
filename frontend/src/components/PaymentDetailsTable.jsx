import React from 'react';
import { formatDateTimeForDisplay } from '../utils/dateFormatter';
import { commonSelectStyle } from '../styles/SelectStyles';

const currency = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 });

const methodLabel = (m) => {
	switch ((m||'').toUpperCase()) {
		case 'CREDITCARD': return '信用卡';
		case 'FPS': return '轉數快';
		case 'PAYME': return 'PayMe';
		case 'CASH': return '現金';
		default: return m || '-';
	}
};

const statusLabel = (s) => {
	switch ((s||'').toUpperCase()) {
		case 'PENDING': return '待付款';
		case 'COMPLETED': return '已付款';
		case 'EXPIRED': return '已過期';
		case 'CANCELLED': return '已取消';
		case 'OUTSTANDING': return '欠款';
        case 'REFUNDED': return '已退款';
		default: return s || '-';
	}
};

const PaymentDetailsTable = ({ 
	payment, 
	showForm = false, 
	showCasher = false,
	newStatus, 
	setNewStatus,
	newMethod,
	setNewMethod,
	paidAmount,
	setPaidAmount,
	notes, 
	setNotes, 
	processing, 
	onSubmit, 
	onCancel,
	onRefund
}) => {
	if (!payment) return null;
	
	const isPending = payment?.status?.toUpperCase() === 'PENDING';
	const isCompleted = payment?.status?.toUpperCase() === 'COMPLETED';

	return (
		<>
			<fieldset>
				<legend>付款資訊</legend>
				
				<table className="common-table">
					<tbody>
						<tr>
							<td><strong>訂單編號：</strong></td>
							<td>{payment.payment_id}</td>
						</tr>
						<tr>
							<td><strong>姓名 (用戶編號)：</strong></td>
							<td>
								{(payment.user_name || payment.user_id)
									? `${payment.user_name || ''}${payment.user_name && payment.user_id ? ' ' : ''}${payment.user_id ? `(${payment.user_id})` : ''}`
									: '(Deleted User)'}
							</td>
						</tr>
						<tr>
							<td><strong>電話：</strong></td>
							<td>{payment.user_mobile || '-'}</td>
						</tr>
						<tr>
							<td><strong>介紹人：</strong></td>
							<td>{payment.user_referrer_name || '-'}</td>
						</tr>
						<tr>
							<td><strong>負責銷售：</strong></td>
							<td>{payment.user_owner_sales_name || '-'}</td>
						</tr>
						<tr>
							<td><strong>活動：</strong></td>
							<td>{payment.event_name || payment.event_id}</td>
						</tr>
						<tr>
							<td><strong>金額：</strong></td>
							<td>{currency.format(Number(payment.amount || 0))}</td>
						</tr>
						<tr>
							<td><strong>欠款金額：</strong></td>
							<td>{currency.format(Number(((payment.amount || 0) - (payment.paid_amount || 0)) || 0))}</td>
						</tr>
						<tr>
							<td><strong>付款方式：</strong></td>
							<td>{methodLabel(payment.method)}</td>
						</tr>
						<tr>
							<td><strong>目前狀態：</strong></td>
							<td>{statusLabel(payment.status)}</td>
						</tr>
						<tr>
							<td><strong>建立時間：</strong></td>
							<td>{formatDateTimeForDisplay(payment.create_time)}</td>
						</tr>
						<tr>
							<td><strong>付款期限：</strong></td>
							<td>{payment.expire_time ? formatDateTimeForDisplay(payment.expire_time) : '-'}</td>
						</tr>
						<tr>
							<td><strong>付款時間：</strong></td>
							<td>{payment.paid_time ? formatDateTimeForDisplay(payment.paid_time) : '-'}</td>
						</tr>
						<tr>
							<td><strong>收據編號：</strong></td>
							<td>{payment.receipt_number || '-'}</td>
						</tr>
						{showCasher && (
							<tr>
								<td><strong>處理員工：</strong></td>
								<td>{payment.casher_name ? `${payment.casher_name} (${payment.casher_id})` : '-'}</td>
							</tr>
						)}
					</tbody>
				</table>
			</fieldset>

			{showForm && (
				<>
					<br />
					<form onSubmit={onSubmit}>
						<fieldset>
							<legend>更新付款狀態</legend>
							
							<table className="common-table">
								<tbody>
									<tr>
										<td><label htmlFor="method">付款方式</label></td>
										<td>
											<select
												id="method"
												value={newMethod}
												onChange={(e) => setNewMethod(e.target.value)}
												required
												style={{ ...commonSelectStyle, width: '100%' }}
											>
												<option value="">-- 請選擇 --</option>
												<option value="CREDITCARD">信用卡</option>
												<option value="FPS">轉數快</option>
												<option value="PAYME">PayMe</option>
												<option value="CASH">現金</option>
											</select>
										</td>
									</tr>
									<tr>
										<td><label htmlFor="paidAmount">收款金額：</label></td>
										<td>
											<div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
												<span
													style={{
														position: 'absolute',
														left: 8,
														top: '50%',
														transform: 'translateY(-50%)',
														pointerEvents: 'none',
														color: '#555',
														fontSize: '0.9em',
													}}
												>
													HKD$
												</span>
												<input
													id="paidAmount"
													type="numeric"
													min="0"
													step="1"
													value={paidAmount ?? ''}
													onChange={(e) => {
														const value = e.target.value;
														if (setPaidAmount) setPaidAmount(value);
														if (setNewStatus) {
															const inputPaid = Number(value || 0);
															const alreadyPaid = Number(payment.paid_amount || 0);
															const totalAmount = Number(payment.amount || 0);
															if (totalAmount > 0) {
																if (alreadyPaid + inputPaid < totalAmount) {
																	setNewStatus('OUTSTANDING');
																} else if (alreadyPaid + inputPaid >= totalAmount) {
																	setNewStatus('COMPLETED');
																}
															}
														}
													}}
													style={{
														width: '100%',
														boxSizing: 'border-box',
														padding: '8px 8px 8px 50px',
														fontSize: '0.9em',
														borderColor: !/^\d*$/.test(paidAmount || '') ? 'red' : ''
													}}
												/>
											</div>
											{!/^\d*$/.test(paidAmount || '') && (
												<small style={{ color: 'red' }}>請輸入有效的金額（僅限數字）。</small>
											)}
										</td>
									</tr>
									<tr>
										<td><label htmlFor="status">更改付款狀態</label></td>
										<td>
											<select
												id="status"
												value={newStatus}
												onChange={(e) => setNewStatus(e.target.value)}
												required
												style={{ ...commonSelectStyle, width: '100%' }}
											>
												<option value="">-- 請選擇 --</option>
												<option value="PENDING">待付款</option>
												<option value="COMPLETED">已付款</option>
												<option value="REFUNDED">已退款</option>
												<option value="OUTSTANDING">欠款</option>
											</select>
										</td>
									</tr>
									<tr>
										<td><label htmlFor="notes">備註（可選）</label></td>
										<td>
											<textarea
												id="notes"
												value={notes}
												onChange={(e) => setNotes(e.target.value)}
												rows={4}
												cols={50}
												placeholder="請輸入處理備註..."
											/>
										</td>
									</tr>
								</tbody>
							</table>
							
							<br />
							
							<button type="submit" disabled={processing}>
								{processing ? '處理中...' : (isPending ? '確認付款' : '更新付款')}
							</button>
							{' '}
								<>
									<button type="button" onClick={onRefund} disabled={processing} className="btn-danger" >
										取消並退款
									</button>
									{' '}
								</>
							<button type="button" onClick={onCancel} disabled={processing} className="btn-secondary">
								取消
							</button>
						</fieldset>
					</form>
				</>
			)}
		</>
	);
};

export default PaymentDetailsTable;
