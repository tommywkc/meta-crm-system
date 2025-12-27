const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  createEnrollment,
  findIfExist,
  checkIsConfirmedEnrolled,
  listConfirmedEnrolled,
  listConfirmedUsersByEvent,
  listActiveEnrolledEventIds,
  updateStatusByEnrollmentId
} = require('../dao/eventEnrollmentsDao');
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

    await updateRemainingSeats(event_id, -1);

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
    }else if(event && (event.price == null || event.price == 0)) {
      console.log('Enrollment for free event, no payment needed.');
      await updateStatusByEnrollmentId(newEnrollment.enrollment_id, 'CONFIRMED');
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

router.get('/enrollments/check', authMiddleware, async (req, res) => {
  try {
    const { event_id, user_id } = req.query;
    console.log('Received enrollment check request from user:', req.user.sub, 'for event_id:', event_id, 'and user_id:', user_id);

    const isEnrolled = await checkIsConfirmedEnrolled(user_id, event_id);
    if (isEnrolled != null) {
      console.log(`User ${user_id} is confirmed enrolled for event ${event_id}`);
      return res.status(200).json(isEnrolled);
    } else {
      console.log(`User ${user_id} is NOT confirmed enrolled for event ${event_id}`);
      return res.status(200).json(null);
    }

  } catch (error) {
    console.error('Enrollment check failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.get('/enrollments/confirmed', authMiddleware, async (req, res) => {
  try {
    const user_id = req.query.user_id || req.user.sub;
    const parsedLimit = parseInt(req.query.limit) || 100;
    const parsedOffset = parseInt(req.query.offset) || 0;

    console.log('Received confirmed enrollments list request from user:', req.user.sub, 'for user_id:', user_id);

    const confirmedEnrollments = await listConfirmedEnrolled(user_id, parsedLimit, parsedOffset);
    console.log(`Found ${confirmedEnrollments ? confirmedEnrollments.length : 0} confirmed enrollments for user ${user_id}`);

    // Enrich enrollments with event details
    const enrichedEnrollments = await Promise.all(
      (confirmedEnrollments || []).map(async (enrollment) => {
        const eventDetails = await findByEventId(enrollment.event_id);
        return {
          ...enrollment,
          ...eventDetails // Merge event details into enrollment
        };
      })
    );

    return res.status(200).json({ enrollments: enrichedEnrollments });

  } catch (error) {
    console.error('Listing confirmed enrollments failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// List event_ids that the current user has enrolled (PENDING or CONFIRMED)
router.get('/enrollments/my-events/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: '未登入' });
    }

    const rows = await listActiveEnrolledEventIds(userId);
    const eventIds = rows.map((r) => r.event_id).filter((id) => id != null);

    return res.status(200).json({ eventIds });
  } catch (error) {
    console.error('Listing active enrolled event IDs failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

// List confirmed-enrolled users for a specific event (for picking session attendees)
router.get('/enrollments/confirmed-users', authMiddleware, async (req, res) => {
  try {
    const { event_id } = req.query;

    if (!event_id) {
      return res.status(400).json({ message: '缺少活動 ID（event_id）' });
    }

    const eventIdNum = parseInt(event_id, 10);
    if (isNaN(eventIdNum)) {
      return res.status(400).json({ message: '無效的活動 ID' });
    }

    console.log('Received confirmed users list request for event_id:', eventIdNum, 'from user:', req.user.sub);

    const users = await listConfirmedUsersByEvent(eventIdNum);

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Listing confirmed users by event failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});


module.exports = router;