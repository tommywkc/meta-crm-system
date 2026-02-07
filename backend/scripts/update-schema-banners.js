require('dotenv').config();
const { query } = require('../db/pool');

async function runUpdate() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS BANNERS (
          banner_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
          image_url TEXT NOT NULL,
          caption TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by BIGINT,
          PRIMARY KEY (banner_id),
          FOREIGN KEY (created_by) REFERENCES USERS(user_id) ON DELETE SET NULL
      );
    `;
    console.log('Executing BANNERS table creation...');
    await query(sql);
    console.log('✓ BANNERS table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error.message);
    process.exit(1);
  }
}

runUpdate();
