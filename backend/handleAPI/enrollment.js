const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createEnrollment, findIfExist } = require('../dao/eventEnrollmentsDao');
const { findByEventId, updateRemainingSeats } = require('../dao/eventsDao');
const { createPayment } = require('../dao/paymentsDao');

// Handle create new enrollment
router.post('/enrollments', authMiddleware, async (req, res) => {
  try {
    console.log('Received create enrollment request from user:', req.user.sub, 'with data:', req.body);

    const { event_id, user_id, enroll_by_id } = req.body;

    const existingEnrollment = await findIfExist(user_id, event_id);
    if (existingEnrollment) {
      return res.status(400).json({ message: '已報名此課堂/講座' });
    }

    if (!event_id || !user_id) {
      return res.status(400).json({ message: '缺少必要的報名資料（需要 event_id 和 user_id）' });
    }

    // Use enroll_by_id from request body if provided, otherwise use authenticated user
    const enrollById = enroll_by_id || req.user.sub;

    const remaining_seats = await findByEventId(event_id)
    if (remaining_seats.remaining_seats != null && remaining_seats.remaining_seats <= 0) {
      return res.status(400).json({ message: '此活動已無剩餘名額' });
    }

    const newEnrollment = await createEnrollment({ event_id, user_id, enroll_by_id: enrollById });
    console.log('Enrollment created successfully:', newEnrollment);

    await updateRemainingSeats(event_id);

    const event = await findByEventId(event_id);
    let paymentInfo = null;
    
    if (event && event.price != null && event.price > 0) {
      console.log(`Enrollment for paid event. Event ID: ${event_id}, Price: ${event.price}`);
      const paymentMethod = req.body.payment_method;
      
      if (!paymentMethod) {
        console.error('Payment method is required for paid events');
        return res.status(400).json({ message: '付費活動需要提供支付方式' });
      }
      
      try {
        // Set payment deadline to 3 days from now at end of day (23:59:59)
        const paymentDeadline = new Date();
        paymentDeadline.setDate(paymentDeadline.getDate() + 3);
        paymentDeadline.setHours(23, 59, 59, 999);
        
        const payment = await createPayment({
            event_id,
            user_id,
            amount: event.price,
            method: paymentMethod,
            enrollment_id: newEnrollment.enrollment_id,
            expire_time: paymentDeadline
        });
        paymentInfo = { ...payment, expire_time: paymentDeadline };
        console.log('Payment record created for enrollment with 3-day deadline.');
      } catch (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        // Rollback enrollment if payment creation fails
        throw new Error('建立付款記錄失敗：' + paymentError.message);
      }
    }
    
    res.status(201).json({ 
      message: '報名成功！', 
      enrollment: newEnrollment,
      payment: paymentInfo
    });
  } catch (error) {
    console.error('Create enrollment failed:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: '伺服器錯誤', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router;