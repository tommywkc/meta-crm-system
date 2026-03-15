require('dotenv').config();
const fs = require('fs');
const { query } = require('./db/pool');

async function runSchema() {
  try {
    const schema = fs.readFileSync('./resources/schema.sql', 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      console.log('Executing statement...');
      await query(statement + ';');
    }
    
    console.log('✓ Schema executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running schema:', error.message);
    process.exit(1);
  }
}

runSchema();
