// src/lib/db.ts
import { Pool, PoolClient } from 'pg';

interface DatabaseConfig {
  readonly connectionString: string;
  readonly ssl?: boolean | object;
  readonly max?: number;
  readonly idleTimeoutMillis?: number;
  readonly connectionTimeoutMillis?: number;
}

class DatabaseConnection {
  private pool: Pool;

  constructor() {
    const config: DatabaseConfig = {
      connectionString: process.env.DATABASE_URL!,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(config);

    this.pool.on('error', (err: Error) => {
      console.error('Erreur pool PostgreSQL:', err);
    });
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    let client: PoolClient | undefined;

    try {
      client = await this.pool.connect();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 200) {
        console.warn(`Requête lente (${duration}ms):`, text);
      }

      return result.rows;
    } catch (error) {
      console.error('Erreur requête DB:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseConnection();
export default db;