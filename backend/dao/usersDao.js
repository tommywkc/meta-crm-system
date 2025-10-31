const { query } = require('../db/pool');

// usersDao: basic CRUD helpers for USERS table

async function createUser({
  password,
  role,
  name,
  mobile,
  email,
  qr_token = null,
  source = null,
  owner_sales = null,
  team = null,
  tags = null,
  note_special = null
}) {
  const sql = `
    INSERT INTO USERS (
      password, role, name, mobile, email, qr_token, source,
      owner_sales, team, tags, note_special
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *;
  `;

  const vals = [
    password,
    role,
    name,
    mobile,
    email,
    qr_token,
    source,
    owner_sales,
    team,
    tags,
    note_special
  ];

  const res = await query(sql, vals);
  return res.rows[0];
}
async function findByUserId(id) {
  const res = await query('SELECT * FROM USERS WHERE user_id = $1', [id]);
  return res.rows[0] || null;
}

async function findUserByEmail(email) {
  const res = await query('SELECT * FROM USERS WHERE email = $1', [email]);
  return res.rows[0] || null;
}

async function findUserByMobile(mobile) {
  const res = await query('SELECT * FROM USERS WHERE mobile = $1', [mobile]);
  return res.rows[0] || null;
}

async function updateByUserId(id, fields = {}) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findByUserId(id);
  const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
  const vals = keys.map(k => fields[k]);
  vals.push(id);
  const sql = `UPDATE USERS SET ${sets} WHERE user_id = $${vals.length} RETURNING *`;
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function removeByUserId(id) {
  await query('DELETE FROM USERS WHERE user_id = $1', [id]);
  return true;
}

async function listByUsersId(limit = 100, offset = 0) {
  const res = await query('SELECT * FROM USERS ORDER BY user_id ASC LIMIT $1 OFFSET $2', [limit, offset]);
  return res.rows;
}

module.exports = { createUser, findByUserId, findUserByEmail, findUserByMobile, updateByUserId, removeByUserId, listByUsersId };