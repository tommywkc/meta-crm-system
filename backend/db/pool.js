const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// 建立連線池
const pool = new Pool({
    //DATABASE_URL : 'postgresql://<username>:<password>>@localhost:<port>>/<database-name>>'
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/meta_academy_crm',
    max: 20,                     // 最大連線數
    idleTimeoutMillis: 30000,    // 閒置連線超時時間
    connectionTimeoutMillis: 2000 // 連線嘗試超時時間
});

// 監聽連線錯誤
pool.on('error', (err, client) => {
    console.error('資料庫連線發生錯誤:', err);
    console.error('問題連線:', client);
});

// 資料庫初始化函數
async function initDatabase() {
    try {
        // 讀取 schema.sql
        const schemaPath = path.join(__dirname, '../resources/schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // 執行 schema.sql
        await pool.query(schema);
        console.log('資料庫初始化成功');
    } catch (err) {
        console.error('資料庫初始化失敗:', err);
        throw err;
    }
}

// 優雅關閉連線池
async function closePool() {
    try {
        await pool.end();
        console.log('資料庫連線池已關閉');
    } catch (err) {
        console.error('關閉連線池時發生錯誤:', err);
        throw err;
    }
}

// 新增一個通用的查詢函數
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    query,
    initDatabase,
    closePool
};