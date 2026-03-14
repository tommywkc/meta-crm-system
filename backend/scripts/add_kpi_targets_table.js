require('dotenv').config({ path: '../.env' });
const { query } = require('../db/pool');

async function migrate() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS KPI_TARGETS (
        kpi_target_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
        target_key VARCHAR(120) NOT NULL UNIQUE,
        year INT NOT NULL,
        month INT NOT NULL,
        target_scope VARCHAR(20) NOT NULL,
        target_user_id BIGINT,
        conversion_rate DECIMAL(8,4),
        renewal_rate DECIMAL(8,4),
        actual_receive_amount DECIMAL(14,2),
        actual_receive_rate DECIMAL(8,4),
        unpaid_followup_count INT,
        seminar_conversion DECIMAL(8,4),
        created_by_id BIGINT,
        updated_by_id BIGINT,
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (kpi_target_id),
        FOREIGN KEY (target_user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
        FOREIGN KEY (created_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
        CONSTRAINT CHK_SCOPE_KPI_TARGETS CHECK (target_scope IN ('GROUP', 'PERSONAL')),
        CONSTRAINT CHK_MONTH_KPI_TARGETS CHECK (month BETWEEN 1 AND 12)
      );
    `);

    console.log('KPI_TARGETS table is ready.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
