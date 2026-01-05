const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listByUser, listByUserWithSearch, listByPaymentId, findByPaymentId, updatePaymentById, searchPayments } = require('../dao/paymentsDao');
const { removeByEnrollmentId, updateStatusByEnrollmentId } = require('../dao/eventEnrollmentsDao');
const { updateRemainingSeats } = require('../dao/eventsDao');


router.get('/users/:userId/payments', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者ID' });
    }

    const q = req.query.q || '';
    let method = req.query.method || null;
    // method can be repeated or comma-separated -> normalize to array of upper-case
    if (method) {
      if (Array.isArray(method)) {
        method = method.map(m => String(m).trim().toUpperCase()).filter(Boolean);
      } else {
        method = String(method).split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
      }
    }
    // status can be provided as repeated query params or comma-separated
    let status = req.query.status || null;
    if (status) {
      if (Array.isArray(status)) {
        status = status.map(s => String(s).trim().toUpperCase()).filter(Boolean);
      } else {
        status = String(status).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      }
    }
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Members can only view their own completed payments
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'member') {
      if (parseInt(req.user.sub, 10) !== userId) {
        return res.status(403).json({ message: '無權限' });
      }
      const payments = await listByUserWithSearch(userId, limit, offset, q, true, method, status);
      return res.json({ payments });
    }

    // Admins and other roles can view payments for the given user (optionally search)
    const payments = await listByUserWithSearch(userId, limit, offset, q, false, method, status);
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
    const q = req.query.q || '';
    let method = req.query.method || null;
    if (method) {
      if (Array.isArray(method)) {
        method = method.map(m => String(m).trim().toUpperCase()).filter(Boolean);
      } else {
        method = String(method).split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
      }
    }
    let status = req.query.status || null;
    if (status) {
      if (Array.isArray(status)) {
        status = status.map(s => String(s).trim().toUpperCase()).filter(Boolean);
      } else {
        status = String(status).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      }
    }

    // If member -> only return their own completed payments
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'member') {
      const userId = parseInt(req.user.sub, 10);
      const payments = await listByUserWithSearch(userId, limit, offset, q, true, method, status);
      return res.json({ payments });
    }

    // Admins: if q provided, search across payments; otherwise return paged list
    if (q || method || status) {
      const payments = await searchPayments(limit, offset, q, method, status);
      return res.json({ payments });
    }

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


    return res.json({ message: '付款資料更新成功', payment: updatedPayment });


  } catch (error) {
    console.error('Update payment failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
