const { query } = require('../db/pool');

let ensured = false;

async function ensureKpiTargetsTable() {
  if (ensured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS KPI_TARGETS (
      kpi_target_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
      target_key VARCHAR(120) NOT NULL UNIQUE,
      year INT NOT NULL,
      month INT NOT NULL,
      target_scope VARCHAR(20) NOT NULL,
      target_user_id BIGINT,
      conversion_rate DECIMAL(8,4),
      renewal_rate DECIMAL(8,4),
      actual_receive_amount DECIMAL(14,2),
      actual_receive_rate DECIMAL(8,4),
      unpaid_followup_count INT,
      seminar_conversion DECIMAL(8,4),
      created_by_id BIGINT,
      updated_by_id BIGINT,
      create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (kpi_target_id),
      FOREIGN KEY (target_user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
      CONSTRAINT CHK_SCOPE_KPI_TARGETS CHECK (target_scope IN ('GROUP', 'PERSONAL')),
      CONSTRAINT CHK_MONTH_KPI_TARGETS CHECK (month BETWEEN 1 AND 12)
    );
  `);

  ensured = true;
}

function buildTargetKey({ year, month, scope, userId = null }) {
  const normalizedScope = String(scope || '').toUpperCase();
  const userPart = normalizedScope === 'PERSONAL' ? String(userId || '') : 'ALL';
  return `${normalizedScope}:${year}-${String(month).padStart(2, '0')}:${userPart}`;
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toNullableInt(value) {
  const num = toNullableNumber(value);
  if (num === null) return null;
  return Math.trunc(num);
}

async function upsertKpiTarget({ year, month, scope, userId = null, targets = {}, actorId = null }) {
  await ensureKpiTargetsTable();

  const normalizedScope = String(scope || '').toUpperCase();
  const targetKey = buildTargetKey({ year, month, scope: normalizedScope, userId });

  const sql = `
    INSERT INTO KPI_TARGETS (
      target_key,
      year,
      month,
      target_scope,
      target_user_id,
      conversion_rate,
      renewal_rate,
      actual_receive_amount,
      actual_receive_rate,
      unpaid_followup_count,
      seminar_conversion,
      created_by_id,
      updated_by_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (target_key)
    DO UPDATE SET
      conversion_rate = EXCLUDED.conversion_rate,
      renewal_rate = EXCLUDED.renewal_rate,
      actual_receive_amount = EXCLUDED.actual_receive_amount,
      actual_receive_rate = EXCLUDED.actual_receive_rate,
      unpaid_followup_count = EXCLUDED.unpaid_followup_count,
      seminar_conversion = EXCLUDED.seminar_conversion,
      updated_by_id = EXCLUDED.updated_by_id,
      update_time = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const vals = [
    targetKey,
    year,
    month,
    normalizedScope,
    normalizedScope === 'PERSONAL' ? userId : null,
    toNullableNumber(targets.conversionRate),
    toNullableNumber(targets.renewalRate),
    toNullableNumber(targets.actualReceiveAmount),
    toNullableNumber(targets.actualReceiveRate),
    toNullableInt(targets.unpaidFollowupCount),
    toNullableNumber(targets.seminarConversion),
    actorId,
    actorId,
  ];

  const res = await query(sql, vals);
  return res.rows[0] || null;
}

async function getKpiTarget({ year, month, scope, userId = null }) {
  await ensureKpiTargetsTable();

  const normalizedScope = String(scope || '').toUpperCase();
  const targetKey = buildTargetKey({ year, month, scope: normalizedScope, userId });

  const res = await query(
    'SELECT * FROM KPI_TARGETS WHERE target_key = $1',
    [targetKey]
  );
  return res.rows[0] || null;
}

module.exports = {
  upsertKpiTarget,
  getKpiTarget,
  ensureKpiTargetsTable,
};
