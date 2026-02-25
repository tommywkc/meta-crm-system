const cron = require('node-cron');
const { query } = require('../db/pool');

async function expirePayments() {
  const sql = `
    UPDATE PAYMENTS
    SET status = 'EXPIRED'
    WHERE status = 'PENDING'
      AND expire_time IS NOT NULL
      AND expire_time <= NOW()
    RETURNING payment_id
  `;
  const res = await query(sql, []);
  return res?.rows?.length || 0;
}

async function clearExpiredSuspensions() {
  const sql = `
    UPDATE USERS u
    SET suspension = FALSE
    WHERE u.suspension = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM SUSPENSION s
        WHERE s.user_id = u.user_id
          AND (s.end_time IS NULL OR s.end_time > NOW())
      )
    RETURNING u.user_id
  `;
  const res = await query(sql, []);
  return res?.rows?.length || 0;
}

/**
 * Start scheduled jobs for payment expiry and suspension cleanup.
 * Defaults:
 *  - Daily at 00:00 (HK time): '0 0 * * *'
 *
 * Environment overrides:
 *  - EXPIRY_SYNC_ENABLED: 'true' | 'false' (default 'true')
 *  - EXPIRY_SYNC_CRON: cron expression (e.g., '0 0 * * *')
 *  - EXPIRY_SYNC_RUN_ON_START: 'true' | 'false' (default 'false')
 *  - TZ: timezone (default 'Asia/Hong_Kong')
 */
function startExpirySchedules({
  cronExpr = process.env.EXPIRY_SYNC_CRON || '0 0 * * *',
  timezone = process.env.TZ || 'Asia/Hong_Kong',
} = {}) {
  const enabled = String(process.env.EXPIRY_SYNC_ENABLED ?? 'true').toLowerCase() === 'true';
  const runOnStart = String(process.env.EXPIRY_SYNC_RUN_ON_START ?? 'false').toLowerCase() === 'true';

  if (!enabled) {
    console.log('[Expiry Scheduler] Disabled by EXPIRY_SYNC_ENABLED=false');
    return null;
  }

  console.log(`[Expiry Scheduler] Scheduling job: cron="${cronExpr}" tz="${timezone}"`);

  const task = cron.schedule(
    cronExpr,
    async () => {
      try {
        console.log('[Expiry Scheduler] Job started');
        const expiredPayments = await expirePayments();
        const clearedSuspensions = await clearExpiredSuspensions();
        console.log('[Expiry Scheduler] Job finished', { expiredPayments, clearedSuspensions });
      } catch (err) {
        console.error('[Expiry Scheduler] Job failed:', err);
      }
    },
    { timezone }
  );

  if (runOnStart) {
    (async () => {
      try {
        console.log('[Expiry Scheduler] Initial run on startup');
        const expiredPayments = await expirePayments();
        const clearedSuspensions = await clearExpiredSuspensions();
        console.log('[Expiry Scheduler] Initial run finished', { expiredPayments, clearedSuspensions });
      } catch (err) {
        console.error('[Expiry Scheduler] Initial run failed:', err);
      }
    })();
  }

  return task;
}

module.exports = { startExpirySchedules, expirePayments, clearExpiredSuspensions };
