const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { createFeedback, listByFeedbackId } = require('../dao/feedbackDao');


// Handle create new feedback
router.post('/feedback', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    console.log('Received create feedback request from user:', req.user.sub, 'with data:', req.body);

    const newFeedback = {
      user_id: req.user.sub,
      testing_role: req.body.testing_role || null,
      rating: req.body.rating || null,
      message: req.body.message || ''
    };

    // rating 為必填，文字描述可選
    if (!newFeedback.rating) {
      return res.status(400).json({ message: '缺少必要的評分資料' });
    }

    const createdFeedback = await createFeedback(newFeedback);
    console.log('Feedback created successfully:', createdFeedback);
    res.status(201).json({ 
      message: '反饋提交成功', 
      feedback: createdFeedback,
      feedback_id: createdFeedback.feedback_id,
      id: createdFeedback.feedback_id 
    });
  } catch (error) {
    console.error('Create feedback failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;