const { pool } = require('../db/pool');

async function checkAndFixSchema() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');

    // 1. Check EVENTS table for promotion_cost
    console.log('Checking EVENTS table...');
    const resultEvents = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'promotion_cost';
    `);

    if (resultEvents.rows.length === 0) {
      console.log('Adding promotion_cost column to EVENTS table...');
      await client.query(`ALTER TABLE EVENTS ADD COLUMN promotion_cost NUMERIC(10,2);`);
      console.log('Added promotion_cost column.');
    } else {
      console.log('EVENTS table already has promotion_cost column.');
    }

    // 2. Check MONTHLY_PROMOTIONS table
    console.log('Checking public.monthly_promotions table existence...');
    // We use to_regclass to check existence
    const resultPromotions = await client.query(`
      SELECT to_regclass('public.monthly_promotions') as table_oid;
    `);

    if (!resultPromotions.rows[0].table_oid) {
      console.log('Creating MONTHLY_PROMOTIONS table...');
      // Note: Use singular/plural correctly.
      // ReportsDAO uses 'MONTHLY_PROMOTIONS' so let's use that.
      await client.query(`
        CREATE TABLE MONTHLY_PROMOTIONS (
            id SERIAL PRIMARY KEY,
            month_str VARCHAR(7) NOT NULL,
            amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            receipt_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Created MONTHLY_PROMOTIONS table.');
    } else {
      console.log('MONTHLY_PROMOTIONS table exists.');
    }

  } catch (err) {
    console.error('Error fixing schema:', err);
  } finally {
    client.release();
    // Use pool.end(), but checking if pool is exported or has .end() (it should).
    // If pool is a Pg Pool instance.
    if (pool.end) await pool.end();
  }
}

checkAndFixSchema();
