const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listByUser, listByPaymentId, findByPaymentId, updatePaymentById } = require('../dao/paymentsDao');
const { removeByEnrollmentId, updateStatusByEnrollmentId } = require('../dao/eventEnrollmentsDao');
const { updateRemainingSeats } = require('../dao/eventsDao');
const { findByUserId } = require('../dao/usersDao');
const { sendEmail } = require('../services/emailService');


router.get('/users/:userId/payments', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者ID' });
    }

    const payments = await listByUser(userId, limit, offset);
    return res.json({ payments });
  } catch (error) {
    console.error('List payments failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});


router.get('/payments', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const payments = await listByPaymentId(limit, offset);
    return res.json({ payments });
  } catch (error) {
    console.error('List payments failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.get('/payments/:paymentId', authMiddleware, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId, 10);
    if (!paymentId) {
      return res.status(400).json({ message: '缺少付款ID' });
    }

    const payment = await findByPaymentId(paymentId);
    if (!payment) {
      return res.status(404).json({ message: '付款記錄不存在' });
    }

    return res.json({ payment });
  } catch (error) {
    console.error('Get payment failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.put('/payments/:paymentId', authMiddleware, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId, 10);
    const updateData = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: '缺少付款ID' });
    }

    const existingPayment = await findByPaymentId(paymentId);
    if (!existingPayment) {
      return res.status(404).json({ message: '付款記錄不存在' });
    }

    const updatedPayment = await updatePaymentById(paymentId, updateData);

    if (updateData.status && (updateData.status.toUpperCase() === 'CANCELLED' || updateData.status.toUpperCase() === 'REFUNDED')) {
        // If payment is cancelled or refunded, remove associated event enrollments
        await removeByEnrollmentId(existingPayment.enrollment_id);
        await updateRemainingSeats(existingPayment.event_id, 1);
    }
    if (updateData.status && (updateData.status.toUpperCase() === 'COMPLETED' || updateData.status.toUpperCase() === 'OUTSTANDING')) {
        // If payment is completed or partly paid, update enrollment status to CONFIRMED
        await updateStatusByEnrollmentId(existingPayment.enrollment_id, 'CONFIRMED');
    }
    if (updateData.status && updateData.status.toUpperCase() === 'PENDING') {
        // If payment is set to pending, update enrollment status to PENDING
        await updateStatusByEnrollmentId(existingPayment.enrollment_id, 'PENDING');
    }

    // After successfully updating the payment and related enrollment/event,
    // try to send a notification email to the payment owner.
    // Email failure should NOT break the API response.
    try {
      const { createNotification } = require('../dao/notificationsDao');
      const user = await findByUserId(existingPayment.user_id);
      const to = user && user.email;

      const subject = '付款資料更新通知';

      const statusUpper = (updatedPayment.status || existingPayment.status || '').toUpperCase();
      const totalAmount =
        updatedPayment.amount !== undefined && updatedPayment.amount !== null
          ? updatedPayment.amount
          : existingPayment.amount;
      const paidAmount =
        updatedPayment.paid_amount !== undefined && updatedPayment.paid_amount !== null
          ? updatedPayment.paid_amount
          : existingPayment.paid_amount || 0;

      const remainingAmount =
        totalAmount != null && paidAmount != null
          ? Number(totalAmount) - Number(paidAmount)
          : null;

      let header;
      switch (statusUpper) {
        case 'COMPLETED':
          header = '付款已完成';
          break;
        case 'OUTSTANDING':
          header = '付款部分完成，仍有未付金額';
          break;
        case 'PENDING':
          header = '付款待處理';
          break;
        case 'CANCELLED':
          header = '付款已取消';
          break;
        case 'REFUNDED':
          header = '付款已退款';
          break;
        case 'EXPIRED':
          header = '付款已過期';
          break;
        default:
          header = '付款資料已更新';
      }

      const lines = [
        header,
        '',
        `付款編號：${paymentId}`,
        totalAmount != null ? `應付金額：${totalAmount}` : '',
        paidAmount != null ? `已付金額：${paidAmount}` : '',
        remainingAmount != null ? `尚需支付：${remainingAmount}` : '',
        statusUpper ? `狀態：${statusUpper}` : ''
      ].filter(Boolean);

      const text = lines.join('\n');

      if (to) {
        await sendEmail({
          to,
          subject,
          text
        });
      } else {
        console.warn(`User ${existingPayment.user_id} has no email configured, skip payment update email`);
      }

      // Also create a notification for the user
      await createNotification({
        user_id: existingPayment.user_id,
        description: text,
        template: subject
      });
    } catch (emailError) {
      console.error('Failed to send payment update email:', emailError);
    }

    return res.json({ message: '付款資料更新成功', payment: updatedPayment });


  } catch (error) {
    console.error('Update payment failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
