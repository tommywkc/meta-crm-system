require('dotenv').config();
const { importHolidays } = require('../services/holidaysImporter');
const { closePool } = require('../db/pool');

(async () => {
  try {
    console.log('Starting holidays import...');
    const result = await importHolidays();
    console.log('Holidays import finished:', result);
  } catch (err) {
    console.error('Holidays import failed:', err);
    process.exitCode = 1;
  } finally {
    try { await closePool(); } catch (_) {}
  }
})();
