const { query } = require('../db/pool');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const sqlPath = path.join(__dirname, '../resources/update_schema_promotion.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL:', sql);
        await query(sql);
        console.log('Success!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();
