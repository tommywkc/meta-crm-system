const { query } = require('../db/pool');

async function run() {
  console.log('Starting schema update for costs...');
  
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
        const colName = col.split(' ')[0];
        // Check if column exists
        const checkSql = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='events' AND column_name='${colName}';
        `;
        const { rows } = await query(checkSql);
        
        if (rows.length === 0) {
             const sql = `ALTER TABLE EVENTS ADD COLUMN ${col};`;
             await query(sql);
             console.log(`Added column ${colName}`);
        } else {
            console.log(`Column ${colName} already exists`);
        }
    } catch (e) {
      console.error(`Failed to add column ${col}:`, e);
    }
  }

  console.log('Schema update complete.');
  process.exit(0);
}

run();
