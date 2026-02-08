const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const dao = require('../dao/reportsDao');

// ensure receipts folder exists
const receiptsDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, receiptsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Admin only
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

// 1. All Customers
router.get('/all-customers', async (req, res) => {
  try {
    const filters = {
      course: req.query.course,
      source: req.query.source,
      dateStart: req.query.dateStart,
      dateEnd: req.query.dateEnd,
      sales: req.query.sales,
      keyword: req.query.q || req.query.keyword
    };
    const data = await dao.getAllCustomers(filters);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// 2. Costs list
router.get('/costs', async (req, res) => {
  try {
    const { courseCategory, year, month } = req.query;
    const data = await dao.getCosts({ courseCategory, year, month });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

router.post('/costs', upload.single('receipt'), async (req, res) => {
  try {
    const { category, course_category, event_id, year, month, amount, description } = req.body;
    let receipt_url = null;
    if (req.file) {
      receipt_url = `/uploads/receipts/${req.file.filename}`;
    }
    const created_by = req.user ? req.user.user_id : null;
    const result = await dao.addCost({
      category,
      course_category,
      event_id,
      year,
      month,
      amount,
      description,
      receipt_url,
      created_by
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add cost' });
  }
});

router.delete('/costs/:id', async (req, res) => {
  try {
    await dao.deleteCost(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete cost' });
  }
});

// 3. Course Customer List
router.get('/course-customers', async (req, res) => {
  try {
    const { courseCategory } = req.query;
    const data = await dao.getCourseCustomerList({ courseCategory });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list course customers' });
  }
});

// 4. Unpaid customers
router.get('/unpaid-customers', async (req, res) => {
  try {
    const { courseCategory, attended } = req.query;
    const data = await dao.getUnpaidCustomers({ courseCategory, attended });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list unpaid customers' });
  }
});

// 5. Financial report
router.get('/financial', async (req, res) => {
  try {
    const { courseCategory, year, month } = req.query;
    if (!year || !month) return res.status(400).json({ error: 'Year and Month required' });
    const data = await dao.getFinancialData({ courseCategory, year, month });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
});

module.exports = router;
