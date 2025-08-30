import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

async function setupDatabase() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found');
    return;
  }

  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    console.log('🔗 Connecting to database...');

    // Create tables manually
    const createTables = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        wallet_address TEXT,
        name TEXT
      );

      -- Wallets table  
      CREATE TABLE IF NOT EXISTS wallets (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        address TEXT NOT NULL UNIQUE,
        private_key TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance INTEGER DEFAULT 0
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tx_hash TEXT NOT NULL UNIQUE,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        amount INTEGER NOT NULL,
        tx_type TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        signature TEXT,
        data JSONB,
        status TEXT DEFAULT 'confirmed'
      );

      -- Certificates table
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_id TEXT NOT NULL UNIQUE,
        producer_address TEXT NOT NULL,
        hydrogen_kg INTEGER NOT NULL,
        energy_source TEXT NOT NULL,
        location TEXT NOT NULL,
        production_date TIMESTAMP NOT NULL,
        issue_date TIMESTAMP DEFAULT NOW(),
        certifier_name TEXT NOT NULL,
        signature TEXT NOT NULL,
        status TEXT DEFAULT 'valid'
      );
    `;

    await pool.query(createTables);
    console.log('✅ Tables created successfully!');

    // Verify tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tables created:', tables.rows.map(r => r.table_name));

    await pool.end();
    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupDatabase();
