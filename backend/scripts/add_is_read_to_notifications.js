require('dotenv').config({ path: '../.env' });
const { query } = require('../db/pool');

async function migrate() {
  try {
    console.log('Adding is_read column to NOTIFICATIONS table...');
    // We use IF NOT EXISTS concept by catching error or checking first, 
    // but simpler is to just try ADD COLUMN and catch "already exists".
    try {
        await query(`ALTER TABLE NOTIFICATIONS ADD COLUMN is_read BOOLEAN DEFAULT FALSE;`);
        console.log('Column added successfully.');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('Column already exists, skipping.');
        } else {
            throw e;
        }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
