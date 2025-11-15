const cron = require('node-cron');
const { importHolidays } = require('./holidaysImporter');

/**
 * Start scheduled jobs for syncing HOLIDAYS from 1823 JSON feed.
 * Defaults:
 *  - Monthly on the 1st 03:00 (HK time): '0 3 1 * *'
 *  - Immediate run once on startup
 *
 * Environment overrides:
 *  - HOLIDAYS_SYNC_ENABLED: 'true' | 'false' (default 'true')
 *  - HOLIDAYS_SYNC_CRON: cron expression (e.g., '0 3 1 1 *' to run every Jan 1 at 03:00)
 *  - HOLIDAYS_SYNC_RUN_ON_START: 'true' | 'false' (default 'true')
 *  - TZ: timezone (default 'Asia/Hong_Kong')
 */
function startHolidaySchedules({
  cronExpr = process.env.HOLIDAYS_SYNC_CRON || '0 3 1 * *',
  timezone = process.env.TZ || 'Asia/Hong_Kong',
} = {}) {
  const enabled = String(process.env.HOLIDAYS_SYNC_ENABLED ?? 'true').toLowerCase() === 'true';
  const runOnStart = String(process.env.HOLIDAYS_SYNC_RUN_ON_START ?? 'true').toLowerCase() === 'true';

  if (!enabled) {
    console.log('[Holidays Scheduler] Disabled by HOLIDAYS_SYNC_ENABLED=false');
    return null;
  }

  console.log(`[Holidays Scheduler] Scheduling job: cron="${cronExpr}" tz="${timezone}"`);

  const task = cron.schedule(
    cronExpr,
    async () => {
      try {
        console.log('[Holidays Scheduler] Sync job started');
        const result = await importHolidays();
        console.log('[Holidays Scheduler] Sync job finished:', result);
      } catch (err) {
        console.error('[Holidays Scheduler] Sync job failed:', err);
      }
    },
    { timezone }
  );

  if (runOnStart) {
    (async () => {
      try {
        console.log('[Holidays Scheduler] Initial sync on startup');
        const result = await importHolidays();
        console.log('[Holidays Scheduler] Initial sync finished:', result);
      } catch (err) {
        console.error('[Holidays Scheduler] Initial sync failed:', err);
      }
    })();
  }

  return task;
}

module.exports = { startHolidaySchedules };
