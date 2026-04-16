const { pool } = require('../db/pool');

async function forceDrop() {
  try {
    console.log('Force dropping EVENT_FINANCIALS...');
    await pool.query('DROP TABLE IF EXISTS event_financials CASCADE');
    console.log('Dropped EVENT_FINANCIALS successfully.');
    
    console.log('Force dropping EVENT_SESSIONS...');
    await pool.query('DROP TABLE IF EXISTS event_sessions CASCADE');
    console.log('Dropped EVENT_SESSIONS successfully.');
    
    console.log('Force dropping EVENT_ENROLLMENTS...');
    await pool.query('DROP TABLE IF EXISTS event_enrollments CASCADE');
    console.log('Dropped EVENT_ENROLLMENTS successfully.');

    console.log('Force dropping EVENTS...');
    await pool.query('DROP TABLE IF EXISTS events CASCADE');
    console.log('Dropped EVENTS successfully.');

  } catch (err) {
    console.error('Error force dropping table:', err);
  } finally {
    pool.end();
  }
}

forceDrop();
