const { query } = require('../db/pool');

async function run() {
  console.log('Checking columns in EVENTS table...');
  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'events';
  `;
  const { rows } = await query(sql);
  console.log(rows);
  process.exit(0);
}

run();
