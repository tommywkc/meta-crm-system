const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getCustomerReport, getCourseSessionReport, getUnpaidCustomersReport, getFinancialReport } = require('../dao/reportsDao');
const { findByEventId, updateByEventId, getEventsWithPromotion } = require('../dao/eventsDao');
const { Parser } = require('json2csv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'promotion-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// 获取全客户资料名单 (JSON 数据用于前端展示)
router.get('/reports/customers', authMiddleware, roleMiddleware('admin', 'sales'), async (req, res) => {
  try {
    const filters = {
      eventId: req.query.eventId,
      source: req.query.source,
      salesId: req.query.salesId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const data = await getCustomerReport(filters);
    res.json(data);
  } catch (error) {
    console.error('Failed to get customer report:', error);
    res.status(500).json({ message: '获取报表数据失败' });
  }
});

// 获取未付款客人名单
router.get('/reports/unpaid-customers', authMiddleware, roleMiddleware('admin', 'sales'), async (req, res) => {
  try {
    const data = await getUnpaidCustomersReport();
    res.json(data);
  } catch (error) {
    console.error('Failed to get unpaid customers report:', error);
    res.status(500).json({ message: '获取未付款客人名单失败' });
  }
});

// 获取财务报表
router.get('/reports/financial', authMiddleware, roleMiddleware('admin', 'sales'), async (req, res) => {
  try {
    const { eventId, monthStr } = req.query;
    if (!eventId || !monthStr) {
      return res.status(400).json({ message: '缺少 eventId 或 monthStr 参数' });
    }
    const data = await getFinancialReport(eventId, monthStr);
    res.json(data);
  } catch (error) {
    console.error('Failed to get financial report:', error);
    res.status(500).json({ message: '获取财务报表失败' });
  }
});

// 取得課程/講座與場次資訊報表
router.get('/reports/course-sessions', authMiddleware, roleMiddleware('admin', 'sales'), async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type
    };

    const items = await getCourseSessionReport(filters);
    res.json({ items });
  } catch (error) {
    console.error('Failed to get course/session report:', error);
    res.status(500).json({ message: '獲取課程/講座資訊失敗' });
  }
});

// Update Rent Cost (Existing)
router.put('/reports/course-sessions/:eventId/rent', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ message: '無效的活動編號' });
    }

    const rentInput = req.body.room_cost ?? req.body.rent ?? null;
    const parsedRent = rentInput === null || rentInput === '' ? null : Number(rentInput);

    if (rentInput !== null && rentInput !== '' && Number.isNaN(parsedRent)) {
      return res.status(400).json({ message: '租場費用需為數字' });
    }

    const existing = await findByEventId(eventId);
    if (!existing) {
      return res.status(404).json({ message: '找不到該活動' });
    }

    const updated = await updateByEventId(eventId, { room_cost: parsedRent });
    res.json({ message: '租場費用已更新', event: updated });
  } catch (error) {
    console.error('Failed to update rent for event:', error);
    res.status(500).json({ message: '更新租場費用失敗' });
  }
});

// 导出 CSV
router.get('/reports/customers/export/csv', authMiddleware, roleMiddleware('admin', 'sales'), async (req, res) => {
  try {
    const filters = {
        eventId: req.query.eventId,
        source: req.query.source,
        salesId: req.query.salesId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };
    const data = await getCustomerReport(filters);

    const fields = ['user_id', 'name', 'mobile', 'email', 'source', 'sales_name', 'enrolled_courses', 'create_time'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('customers_report.csv');
    return res.send(csv);

  } catch (error) {
    console.error('Export CSV failed:', error);
    res.status(500).send('Export failed');
  }
});

module.exports = router;
