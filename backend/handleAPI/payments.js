const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listByUser, listByPaymentId, findByPaymentId, updatePaymentById } = require('../dao/paymentsDao');
const { removeByEnrollmentId, updateStatusByEnrollmentId } = require('../dao/eventEnrollmentsDao');
const { updateRemainingSeats } = require('../dao/eventsDao');


router.get('/users/:userId/payments', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者ID' });
    }

    const payments = await listByUser(userId);
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
    if (updateData.status && updateData.status.toUpperCase() === 'COMPLETED') {
        // If payment is completed, update enrollment status to CONFIRMED
        await updateStatusByEnrollmentId(existingPayment.enrollment_id, 'CONFIRMED');
    }
    if (updateData.status && updateData.status.toUpperCase() === 'PENDING') {
        // If payment is set to pending, update enrollment status to PENDING
        await updateStatusByEnrollmentId(existingPayment.enrollment_id, 'PENDING');
    }


    return res.json({ message: '付款資料更新成功', payment: updatedPayment });


  } catch (error) {
    console.error('Update payment failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
