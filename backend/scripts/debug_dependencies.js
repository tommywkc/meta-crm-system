const { pool } = require('../db/pool');

async function checkDependencies() {
  try {
    console.log('Checking dependencies for table "events"...');
    const res = await pool.query(`
      SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='events';
    `);
    console.table(res.rows);
    
    console.log('Checking if table "event_financials" exists...');
    const res2 = await pool.query(`
        SELECT * FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_financials'
    `);
    console.table(res2.rows);

  } catch (err) {
    console.error('Error checking dependencies:', err);
  } finally {
    pool.end();
  }
}

checkDependencies();
