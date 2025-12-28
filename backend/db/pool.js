const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Always load backend/.env regardless of where Node is started from
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function envTruthy(value) {
    if (value == null) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'require';
}

function envFalsey(value) {
    if (value == null) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized === '0' || normalized === 'false' || normalized === 'no';
}

function computeSslConfig() {
    const host = String(process.env.DB_HOST || '').trim();
    const shouldUseSsl = envTruthy(process.env.DB_SSL) || host.endsWith('.postgres.database.azure.com');
    if (!shouldUseSsl) return undefined;

    // Azure PostgreSQL often requires SSL. Default to not validating CA unless explicitly enabled.
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED == null
        ? false
        : !envFalsey(process.env.DB_SSL_REJECT_UNAUTHORIZED);

    return { rejectUnauthorized };
}

// Postgres connection pool and helper functions
// Provides initDatabase, query, and graceful pool shutdown
// (Configuration via environment variables)
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'meta_academy_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,                     // maximum number of clients in the pool
    idleTimeoutMillis: 30000,    // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // number of ms to wait before timing out when connecting a new client
    ssl: computeSslConfig(),
    options: process.env.DB_OPTIONS || '-c timezone=Asia/Hong_Kong' // Set timezone to Hong Kong (UTC+8)
});

// Listen for unexpected errors on idle clients
pool.on('error', (err, client) => {
    console.error('Database connection error:', err);
    console.error('Problematic client:', client);
});

// Initialize the database by executing the schema SQL file
async function initDatabase() {
    try {
        // Read schema.sql
        const schemaPath = path.join(__dirname, '../resources/schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // Execute schema.sql
        await pool.query(schema);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization failed:', err);
        throw err;
    }
}

// Gracefully close the pool
async function closePool() {
    try {
        await pool.end();
        console.log('Database connection pool closed');
    } catch (err) {
        console.error('Error closing connection pool:', err);
        throw err;
    }
}

// Generic query helper that acquires/releases a client
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