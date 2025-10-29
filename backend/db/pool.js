const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// 建立連線池
const pool = new Pool({
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

// 簡易查詢 helper
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('執行查詢:', { text, duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('查詢失敗:', err);
        throw err;
    }
}

// 交易 helper
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
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

module.exports = {
    pool,
    query,
    transaction,
    initDatabase,
    closePool
};