const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getCustomerReport, getCourseSessionReport, getMonthlyPromotions, createMonthlyPromotion, deleteMonthlyPromotion, getUnpaidCustomersReport, getFinancialReport } = require('../dao/reportsDao');
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

// Get Monthly Promotions
router.get('/reports/promotions', authMiddleware, roleMiddleware(['admin', 'sales']), async (req, res) => {
    try {
        const promotions = await getMonthlyPromotions();
        // Since we store local paths, map them to accessible URLs if needed
        // Assuming we serve 'uploads' folder as static or similar
        // For simplicity, just return the raw path or a relative URL
        const mapped = promotions.map(p => ({
            ...p,
            is_manual: true,
            receipt_url: p.receipt_path ? `${process.env.API_BASE_URL || 'http://localhost:4000'}/uploads/${path.basename(p.receipt_path)}` : null
        }));

        // Fetch events with promotion cost
        const events = await getEventsWithPromotion();
        const eventPromotions = events.map(e => {
            let monthStr;
            if (e.datetime_start) {
                const date = new Date(e.datetime_start);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                monthStr = `${year}-${month}`;
            } else {
                monthStr = 'Unknown';
            }

            return {
                id: `evt-${e.event_id}`,
                month_str: monthStr,
                amount: e.promotion_cost,
                receipt_url: null,
                is_manual: false, // Flag to indicate this is auto-generated from Event
                note: `[活动] #${e.event_id} ${e.event_name}`,
                created_at: e.datetime_start
            };
        });

        // Combine manual and event records
        const combined = [...mapped, ...eventPromotions];

        // Sort by month_str desc, then created_at desc
        combined.sort((a, b) => {
            if (a.month_str < b.month_str) return 1;
            if (a.month_str > b.month_str) return -1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        res.json({ success: true, promotions: combined });
    } catch (err) {
        console.error('Error fetching promotions:', err);
        res.status(500).json({ success: false, message: '无法获取宣传费记录' });
    }
});

// Create Monthly Promotion
router.post('/reports/promotions', authMiddleware, roleMiddleware(['admin']), upload.single('receipt'), async (req, res) => {
    try {
        console.log('Received promotion create request:', { body: req.body, file: req.file, user: req.user });
        let { month_str, amount } = req.body;
        
        if (!month_str || !amount) {
            return res.status(400).json({ success: false, message: '请提供月份和金额' });
        }

        // Parse amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
             return res.status(400).json({ success: false, message: '金额格式错误' });
        }
        
        // Save relative path to DB so we can serve it easily via /uploads route
        // upload.file.path is absolute now because destination is absolute.
        // We want to store just the filename or relative path 'uploads/filename'
        
        // Wait, server.js serves 'uploads' folder as static route '/uploads'.
        // So we just need the filename to construct the URL.
        // But for consistency with existing code, let's see. 
        // Existing code used 'uploads/' relative path for multer destination.
        
        const receiptPath = req.file ? `uploads/${req.file.filename}` : null;
        
        const newPromo = await createMonthlyPromotion({ month_str, amount: amountNum, receipt_path: receiptPath });
        res.json({ success: true, promotion: newPromo });
    } catch (err) {
        console.error('Error creating promotion:', err);
        res.status(500).json({ success: false, message: '无法创建宣传费记录: ' + err.message });
    }
});

// Delete Monthly Promotion
router.delete('/reports/promotions/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) return res.status(400).json({ success: false, message: 'ID missing' });
        
        await deleteMonthlyPromotion(id);
        res.json({ success: true, message: '记录已删除' });
    } catch (err) {
        console.error('Error deleting promotion:', err);
        res.status(500).json({ success: false, message: '删除失败' });
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
