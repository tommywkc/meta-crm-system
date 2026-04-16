const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { listLogs } = require('../dao/logsDao');

router.get('/logs', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const actionRaw = req.query.action ? String(req.query.action).trim().toUpperCase() : null;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    const rows = await listLogs({ action: actionRaw, limit, offset });
    const logs = rows.map((row) => {
      let details_json = null;
      if (row?.details) {
        try {
          details_json = JSON.parse(row.details);
        } catch (e) {
          details_json = null;
        }
      }

      return {
        ...row,
        details_json,
      };
    });

    return res.json({ logs });
  } catch (error) {
    console.error('List logs failed:', error);
    return res.status(500).json({ message: '無法載入記錄' });
  }
});

module.exports = router;
