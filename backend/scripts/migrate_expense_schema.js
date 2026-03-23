/**
 * migrate_expense_schema.js
 * 
 * 迁移脚本：补齐宣传费、杂费相关的数据库表结构
 * 适用于从旧版本拉取代码后本地 DB 缺少对应字段/表的情况
 * 
 * 运行方式：node scripts/migrate_expense_schema.js
 */

const { pool } = require('../db/pool');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('=== 开始迁移 Expense Schema ===\n');

        // 1. EVENTS 表 - 补齐费用字段
        const costColumns = [
            { col: 'promotion_cost', type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'misc_cost',      type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'salary_cost',    type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'freight_cost',   type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'utilities_cost', type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'telecom_cost',   type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'cog_cost',       type: 'DECIMAL(12,2) DEFAULT 0' },
            { col: 'room_cost',      type: 'DECIMAL(12,2) DEFAULT 0' },
        ];

        for (const { col, type } of costColumns) {
            const check = await client.query(
                `SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name=$1`,
                [col]
            );
            if (check.rows.length === 0) {
                await client.query(`ALTER TABLE EVENTS ADD COLUMN ${col} ${type}`);
                console.log(`✅ EVENTS: 已新增字段 ${col}`);
            } else {
                console.log(`ℹ️  EVENTS: 字段 ${col} 已存在，跳过`);
            }
        }

        // 2. EVENT_FINANCIALS 表
        const efCheck = await client.query(
            `SELECT to_regclass('public.event_financials') AS oid`
        );
        if (!efCheck.rows[0].oid) {
            await client.query(`
                CREATE TABLE EVENT_FINANCIALS (
                    event_id    BIGINT PRIMARY KEY,
                    room_cost   DECIMAL(12,2) DEFAULT 0,
                    promotion_cost DECIMAL(12,2) DEFAULT 0,
                    misc_cost   DECIMAL(12,2) DEFAULT 0,
                    salary_cost DECIMAL(12,2) DEFAULT 0,
                    freight_cost DECIMAL(12,2) DEFAULT 0,
                    telecom_cost DECIMAL(12,2) DEFAULT 0,
                    cog_cost    DECIMAL(12,2) DEFAULT 0,
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_event_financial_event
                        FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_event_financials_updated_at ON EVENT_FINANCIALS(updated_at);
            `);
            console.log('✅ EVENT_FINANCIALS 表已建立');

            // 为现有活动补充一行记录
            await client.query(`
                INSERT INTO EVENT_FINANCIALS (event_id)
                SELECT event_id FROM EVENTS
                ON CONFLICT (event_id) DO NOTHING
            `);
            console.log('✅ EVENT_FINANCIALS 已为现有活动补充初始行');
        } else {
            console.log('ℹ️  EVENT_FINANCIALS 表已存在，跳过建表');

            // 确保现有活动都有对应行
            const inserted = await client.query(`
                INSERT INTO EVENT_FINANCIALS (event_id)
                SELECT event_id FROM EVENTS
                WHERE event_id NOT IN (SELECT event_id FROM EVENT_FINANCIALS)
                ON CONFLICT (event_id) DO NOTHING
            `);
            if (inserted.rowCount > 0) {
                console.log(`✅ EVENT_FINANCIALS 补充了 ${inserted.rowCount} 条缺失记录`);
            }
        }

        // 3. PROMOTIONS 表
        const promoCheck = await client.query(
            `SELECT to_regclass('public.promotions') AS oid`
        );
        if (!promoCheck.rows[0].oid) {
            await client.query(`
                CREATE TABLE PROMOTIONS (
                    id           SERIAL PRIMARY KEY,
                    event_id     BIGINT,
                    expense_date DATE NOT NULL,
                    amount       DECIMAL(12,2) NOT NULL,
                    description  TEXT,
                    receipt_path TEXT,
                    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_promotions_event_id ON PROMOTIONS(event_id);
                CREATE INDEX IF NOT EXISTS idx_promotions_expense_date ON PROMOTIONS(expense_date);
            `);
            console.log('✅ PROMOTIONS 表已建立');
        } else {
            console.log('ℹ️  PROMOTIONS 表已存在，跳过');
        }

        // 4. MISC_EXPENSES 表
        const miscCheck = await client.query(
            `SELECT to_regclass('public.misc_expenses') AS oid`
        );
        if (!miscCheck.rows[0].oid) {
            await client.query(`
                CREATE TABLE MISC_EXPENSES (
                    id           SERIAL PRIMARY KEY,
                    event_id     BIGINT,
                    expense_date DATE NOT NULL,
                    amount       DECIMAL(12,2) NOT NULL,
                    description  TEXT,
                    receipt_path TEXT,
                    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_misc_expenses_event_id ON MISC_EXPENSES(event_id);
                CREATE INDEX IF NOT EXISTS idx_misc_expenses_expense_date ON MISC_EXPENSES(expense_date);
            `);
            console.log('✅ MISC_EXPENSES 表已建立');
        } else {
            console.log('ℹ️  MISC_EXPENSES 表已存在，跳过');
        }

        await client.query('COMMIT');
        console.log('\n=== 迁移完成 ✅ ===');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ 迁移失败，已回滚：', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
