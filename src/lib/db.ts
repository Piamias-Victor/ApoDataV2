// src/lib/db.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Max clients in pool
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 2000,
    ssl: {
        rejectUnauthorized: false
    }
});

// Singleton pattern for DB connection
let dbInstance: Pool | null = null;

export const getDb = (): Pool => {
    if (!dbInstance) {
        dbInstance = pool;
    }
    return dbInstance;
};

export const query = async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    const start = Date.now();
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
    }

    return res;
};

export const db = {
    query
};
