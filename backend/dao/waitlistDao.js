// Waitlist DAO — helpers for managing session waitlists stored as JSON list
const { query } = require('../db/pool');

const normalizeWaitlistEntry = (entry) => {
  if (entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'user_id')) {
    return {
      user_id: entry.user_id,
      priority: entry.priority ?? null,
    };
  }
  return { user_id: entry, priority: null };
};

const parseWaitlist = (raw) => {
  if (!raw) return [];
  const source = Array.isArray(raw) ? raw : (() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  })();

  return source.map((entry) => normalizeWaitlistEntry(entry));
};

async function createWaitlist({ session_id, waitlist = '[]' }) {
  const sql = `INSERT INTO WAITLIST (session_id, waitlist) VALUES ($1,$2) RETURNING *`;
  const vals = [session_id, waitlist];
  const res = await query(sql, vals);
  return res.rows[0];
}

async function updateBySessionId(session_id, waitlist = '[]') {
  const sql = `UPDATE WAITLIST SET waitlist = $1 WHERE session_id = $2 RETURNING *`;
  const vals = [waitlist, session_id];
  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function findBySessionId(session_id) {
  const res = await query('SELECT * FROM WAITLIST WHERE session_id = $1', [session_id]);
  return res.rows[0] || null;
}

async function appendUserToWaitlist(session_id, user_id, priority = null) {
  const existing = await findBySessionId(session_id);
  const currentList = existing ? parseWaitlist(existing.waitlist) : [];
  const normalized = currentList.map((v) => String(v?.user_id));
  if (normalized.includes(String(user_id))) {
    const nextRaw = JSON.stringify(currentList);
    if (!existing) {
      return createWaitlist({ session_id, waitlist: nextRaw });
    }
    return updateBySessionId(session_id, nextRaw);
  }

  const nextEntry = { user_id, priority };
  const normalizedPriority = (value) => {
    if (value === 1 || value === 2 || value === 3) return value;
    return 3;
  };

  const targetPriority = normalizedPriority(priority);
  let insertIndex = currentList.length;

  if (targetPriority === 1) {
    insertIndex = currentList.findIndex((entry) => normalizedPriority(entry?.priority) >= 2);
  } else if (targetPriority === 2) {
    insertIndex = currentList.findIndex((entry) => normalizedPriority(entry?.priority) >= 3);
  }

  if (insertIndex === -1) {
    insertIndex = currentList.length;
  }

  const nextList = [...currentList];
  nextList.splice(insertIndex, 0, nextEntry);

  const nextRaw = JSON.stringify(nextList);
  if (!existing) {
    return createWaitlist({ session_id, waitlist: nextRaw });
  }
  return updateBySessionId(session_id, nextRaw);
}

async function listAll() {
  const res = await query('SELECT * FROM WAITLIST ORDER BY wait_id DESC');
  return res.rows || [];
}

async function removeByWaitlistId(id) {
  await query('DELETE FROM WAITLIST WHERE wait_id = $1', [id]);
  return true;
}

module.exports = { createWaitlist, updateBySessionId, findBySessionId, listAll, removeByWaitlistId, appendUserToWaitlist, parseWaitlist };