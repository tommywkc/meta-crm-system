const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { listHolidays } = require('../dao/holidaysDao');
const { importHolidays } = require('../services/holidaysImporter');

// List holidays
router.get('/holidays', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const offset = parseInt(req.query.offset) || 0;
    const rows = await listHolidays(limit, offset);
    res.json({ holidays: rows });
  } catch (err) {
    console.error('List holidays failed:', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Import/sync holidays from 1823 API (admin only)
router.post('/holidays/import', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { url } = req.body || {};
    const result = await importHolidays({ url });
    res.json({ message: 'Holidays sync completed', ...result });
  } catch (err) {
    console.error('Import holidays failed:', err);
    res.status(500).json({ message: err.message || '匯入失敗' });
  }
});

module.exports = router;
