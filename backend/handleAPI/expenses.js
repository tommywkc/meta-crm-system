const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const expensesDao = require('../dao/expensesDao');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Setup multer for receipt uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- PROMOTIONS ---

// Get promotions (optionally filter by eventId or monthStr)
router.get('/promotions', authMiddleware, roleMiddleware(['ADMIN', 'SALES']), async (req, res) => {
    try {
        const { eventId, month } = req.query;
        const promotions = await expensesDao.getPromotions(eventId, month);
        
        const mapped = promotions.map(p => ({
            ...p,
            receipt_url: p.receipt_path ? `${process.env.API_BASE_URL || 'http://localhost:4000'}/uploads/${path.basename(p.receipt_path)}` : null
        }));
        
        res.status(200).json(mapped);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add promotion
router.post('/promotions', authMiddleware, roleMiddleware(['ADMIN']), upload.single('receipt'), async (req, res) => {
    try {
        let { event_id, expense_date, amount, description } = req.body;
        
        if (!expense_date || !amount) {
            return res.status(400).json({ error: 'expense_date and amount are required' });
        }

        const receiptPath = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const parsedEventId = event_id && event_id !== 'null' ? parseInt(event_id, 10) : null;

        const newPromotion = await expensesDao.addPromotion(parsedEventId, expense_date, amount, description, receiptPath);
        res.status(201).json(newPromotion);
    } catch (error) {
        console.error('Error adding promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete promotion
router.delete('/promotions/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await expensesDao.deletePromotion(id);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- MISC EXPENSES ---

// Get misc expenses
router.get('/misc', authMiddleware, roleMiddleware(['ADMIN', 'SALES']), async (req, res) => {
    try {
        const { eventId, month } = req.query;
        const misc = await expensesDao.getMiscExpenses(eventId, month);
        
        const mapped = misc.map(p => ({
            ...p,
            receipt_url: p.receipt_path ? `${process.env.API_BASE_URL || 'http://localhost:4000'}/uploads/${path.basename(p.receipt_path)}` : null
        }));
        
        res.status(200).json(mapped);
    } catch (error) {
        console.error('Error fetching misc expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add misc expense
router.post('/misc', authMiddleware, roleMiddleware(['ADMIN']), upload.single('receipt'), async (req, res) => {
    try {
        let { event_id, expense_date, amount, description } = req.body;
        
        if (!expense_date || !amount) {
            return res.status(400).json({ error: 'expense_date and amount are required' });
        }

        const receiptPath = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const parsedEventId = event_id && event_id !== 'null' ? parseInt(event_id, 10) : null;

        const newMisc = await expensesDao.addMiscExpense(parsedEventId, expense_date, amount, description, receiptPath);
        res.status(201).json(newMisc);
    } catch (error) {
        console.error('Error adding misc expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete misc expense
router.delete('/misc/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await expensesDao.deleteMiscExpense(id);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting misc expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;