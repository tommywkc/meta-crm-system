const express = require('express');
const router = express.Router();
const expensesDao = require('../dao/expensesDao');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// --- PROMOTIONS ---

// Get promotions (optionally filter by eventId or monthStr)
router.get('/promotions', authMiddleware, roleMiddleware(['ADMIN', 'SALES']), async (req, res) => {
    try {
        const { eventId, month } = req.query;
        const promotions = await expensesDao.getPromotions(eventId, month);
        
        res.status(200).json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add promotion
router.post('/promotions', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
    try {
        let { event_id, expense_date, amount, description } = req.body;
        
        if (!expense_date || !amount) {
            return res.status(400).json({ error: 'expense_date and amount are required' });
        }

        const parsedEventId = event_id && event_id !== 'null' ? parseInt(event_id, 10) : null;

        const newPromotion = await expensesDao.addPromotion(parsedEventId, expense_date, amount, description, null);
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
        
        res.status(200).json(misc);
    } catch (error) {
        console.error('Error fetching misc expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add misc expense
router.post('/misc', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
    try {
        let { event_id, expense_date, amount, description } = req.body;
        
        if (!expense_date || !amount) {
            return res.status(400).json({ error: 'expense_date and amount are required' });
        }

        const parsedEventId = event_id && event_id !== 'null' ? parseInt(event_id, 10) : null;

        const newMisc = await expensesDao.addMiscExpense(parsedEventId, expense_date, amount, description, null);
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