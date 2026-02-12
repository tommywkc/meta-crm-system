const { query } = require('../db/pool');

async function run() {
  console.log('Force updating schema for costs...');
  
  const columns = [
    'promotion_cost DECIMAL(12,2) DEFAULT 0',
    'misc_cost DECIMAL(12,2) DEFAULT 0',
    'salary_cost DECIMAL(12,2) DEFAULT 0',
    'freight_cost DECIMAL(12,2) DEFAULT 0',
    'utilities_cost DECIMAL(12,2) DEFAULT 0',
    'telecom_cost DECIMAL(12,2) DEFAULT 0',
    'cog_cost DECIMAL(12,2) DEFAULT 0'
  ];

  for (const col of columns) {
    try {
        const sql = `ALTER TABLE EVENTS ADD COLUMN IF NOT EXISTS ${col};`;
        console.log(`Executing: ${sql}`);
        await query(sql);
        console.log(`Success.`);
    } catch (e) {
      console.error(`Failed:`, e.message);
    }
  }

  console.log('Schema update complete.');
  process.exit(0);
}

run();
