const { query } = require('../db/pool');

// Create a new holiday
async function createHoliday({ holiday_date, name_tc, uid = null }) {
  const sql = `
    INSERT INTO HOLIDAYS (holiday_date, name_tc, uid)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const vals = [holiday_date, name_tc, uid];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

// Get a holiday by primary key id
async function findById(id) {
  const res = await query('SELECT * FROM HOLIDAYS WHERE id = $1', [id]);
  return res.rows[0] || null;
}

// Get a holiday by exact date
async function findByDate(holiday_date) {
  const res = await query('SELECT * FROM HOLIDAYS WHERE holiday_date = $1', [holiday_date]);
  return res.rows[0] || null;
}

// List holidays ordered by date (ascending)
async function listHolidays(limit = 200, offset = 0) {
  const sql = `
    SELECT *
    FROM HOLIDAYS
    ORDER BY holiday_date ASC
    LIMIT $1 OFFSET $2;
  `;
  const res = await query(sql, [limit, offset]);
  return res.rows;
}

// Update arbitrary fields by id
async function updateById(id, fields = {}) {
  const keys = Object.keys(fields || {});
  if (keys.length === 0) return findById(id);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const vals = keys.map((k) => fields[k]);
  vals.push(id);
  const sql = `UPDATE HOLIDAYS SET ${sets} WHERE id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

// Delete a holiday by id
async function removeById(id) {
  await query('DELETE FROM HOLIDAYS WHERE id = $1', [id]);
  return true;
}

module.exports = {
  createHoliday,
  findById,
  findByDate,
  listHolidays,
  updateById,
  removeById,
};
