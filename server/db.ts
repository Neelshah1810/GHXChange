import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { users, wallets, transactions, certificates } from '@shared/schema';

// Use environment variable or fallback to null for in-memory storage
const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;
let db: any = null;

if (DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: DATABASE_URL });
    db = drizzle(pool);
    console.log('Database configured successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Falling back to in-memory storage');
    pool = null;
    db = null;
  }
} else {
  console.log('No DATABASE_URL provided, using in-memory storage');
}

export { db, pool };
export { users, wallets, transactions, certificates };
