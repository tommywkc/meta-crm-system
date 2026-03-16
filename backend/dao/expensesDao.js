const { pool } = require('../db/pool');

// Add a promotion expense
const addPromotion = async (eventId, expenseDate, amount, description, receiptPath) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO PROMOTIONS (event_id, expense_date, amount, description, receipt_path)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await client.query(insertQuery, [eventId || null, expenseDate, amount, description, receiptPath]);

        if (eventId) {
            // Update the promotion_cost in EVENTS and EVENT_FINANCIALS
            await updateEventPromotionCost(client, eventId);
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// Get promotions with optional filtering by event_id or month (YYYY-MM)
const getPromotions = async (eventId, monthStr) => {
    let query = `SELECT * FROM PROMOTIONS WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (eventId) {
        query += ` AND event_id = $${paramIndex}`;
        params.push(eventId);
        paramIndex++;
    }

    if (monthStr) {
        query += ` AND TO_CHAR(expense_date, 'YYYY-MM') = $${paramIndex}`;
        params.push(monthStr);
        paramIndex++;
    }

    query += ` ORDER BY expense_date DESC, id DESC`;
    const result = await pool.query(query, params);
    return result.rows;
};

// Delete a promotion expense
const deletePromotion = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const selectQuery = `SELECT event_id FROM PROMOTIONS WHERE id = $1`;
        const res = await client.query(selectQuery, [id]);
        
        if (res.rows.length === 0) {
            throw new Error('Promotion not found');
        }
        
        const eventId = res.rows[0].event_id;

        const deleteQuery = `DELETE FROM PROMOTIONS WHERE id = $1`;
        await client.query(deleteQuery, [id]);

        if (eventId) {
            await updateEventPromotionCost(client, eventId);
        }

        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// Internal function to update total
const updateEventPromotionCost = async (client, eventId) => {
    const sumQuery = `SELECT SUM(amount) as total FROM PROMOTIONS WHERE event_id = $1`;
    const sumRes = await client.query(sumQuery, [eventId]);
    const totalAmount = sumRes.rows[0].total || 0;

    const updateEventQuery = `UPDATE EVENTS SET promotion_cost = $1 WHERE event_id = $2`;
    await client.query(updateEventQuery, [totalAmount, eventId]);

    const updateFinancialsQuery = `UPDATE EVENT_FINANCIALS SET promotion_cost = $1, updated_at = CURRENT_TIMESTAMP WHERE event_id = $2`;
    await client.query(updateFinancialsQuery, [totalAmount, eventId]);
};

// --- MISC EXPENSES ---

// Add a misc expense
const addMiscExpense = async (eventId, expenseDate, amount, description, receiptPath) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO MISC_EXPENSES (event_id, expense_date, amount, description, receipt_path)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await client.query(insertQuery, [eventId || null, expenseDate, amount, description, receiptPath]);

        if (eventId) {
            await updateEventMiscCost(client, eventId);
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// Get misc expenses
const getMiscExpenses = async (eventId, monthStr) => {
    let query = `SELECT * FROM MISC_EXPENSES WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (eventId) {
        query += ` AND event_id = $${paramIndex}`;
        params.push(eventId);
        paramIndex++;
    }

    if (monthStr) {
        query += ` AND TO_CHAR(expense_date, 'YYYY-MM') = $${paramIndex}`;
        params.push(monthStr);
        paramIndex++;
    }

    query += ` ORDER BY expense_date DESC, id DESC`;
    const result = await pool.query(query, params);
    return result.rows;
};

// Delete a misc expense
const deleteMiscExpense = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const selectQuery = `SELECT event_id FROM MISC_EXPENSES WHERE id = $1`;
        const res = await client.query(selectQuery, [id]);
        
        if (res.rows.length === 0) {
            throw new Error('Misc expense not found');
        }
        
        const eventId = res.rows[0].event_id;

        const deleteQuery = `DELETE FROM MISC_EXPENSES WHERE id = $1`;
        await client.query(deleteQuery, [id]);

        if (eventId) {
            await updateEventMiscCost(client, eventId);
        }

        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// Internal function to update total
const updateEventMiscCost = async (client, eventId) => {
    const sumQuery = `SELECT SUM(amount) as total FROM MISC_EXPENSES WHERE event_id = $1`;
    const sumRes = await client.query(sumQuery, [eventId]);
    const totalAmount = sumRes.rows[0].total || 0;

    const updateEventQuery = `UPDATE EVENTS SET misc_cost = $1 WHERE event_id = $2`;
    await client.query(updateEventQuery, [totalAmount, eventId]);

    const updateFinancialsQuery = `UPDATE EVENT_FINANCIALS SET misc_cost = $1, updated_at = CURRENT_TIMESTAMP WHERE event_id = $2`;
    await client.query(updateFinancialsQuery, [totalAmount, eventId]);
};

module.exports = {
    addPromotion,
    getPromotions,
    deletePromotion,
    addMiscExpense,
    getMiscExpenses,
    deleteMiscExpense
};
