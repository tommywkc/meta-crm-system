const { query } = require('../db/pool');

async function createHoliday({ holiday_name, holiday_date, description = null }) {
  const sql = `INSERT INTO holidays (holiday_name, holiday_date, description) VALUES ($1,$2,$3) RETURNING *`;
  const vals = [holiday_name, holiday_date, description];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function findByHolidayId(id) {
  const res = await query('SELECT * FROM holidays WHERE holiday_id = $1', [id]);
  return res.rows[0] || null;
}

async function listHolidays(limit = 100) {
  const res = await query('SELECT * FROM holidays ORDER BY holiday_date DESC LIMIT $1', [limit]);
  return res.rows;
}

async function removeHolidayById(id) {
  await query('DELETE FROM holidays WHERE holiday_id = $1', [id]);
  return true;
}

module.exports = { createHoliday, findByHolidayId, listHolidays, removeHolidayById };
