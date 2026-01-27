const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { findByUserId } = require('../dao/usersDao');
const { sendEmail } = require('../services/emailService');

// Simple endpoint to trigger a test email from the UI header button.
// Authenticated user only; by default sends to the current user's email.
router.post('/email/send', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await findByUserId(userId);

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    const body = req.body || {};
    const to = user.email;

    if (!to) {
      return res.status(400).json({ message: '此使用者沒有設定 Email' });
    }

    const subject = body.subject || 'Meta Academy CRM 測試電郵';
    const text =
      body.text ||
      `這是一封從 Meta Academy CRM 按下「Email」按鈕所觸發的測試電郵。

使用者：${user.name || ''} (ID: ${user.user_id || userId})`;

    await sendEmail({ to, subject, text });

    return res.json({ message: '電郵已送出（如 SendGrid 設定正確）' });
  } catch (error) {
    console.error('Send email failed:', error);
    return res.status(500).json({ message: '寄送電郵失敗', error: error.message || String(error) });
  }
});

module.exports = router;
