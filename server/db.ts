import { Pool } from 'pg';
import { readFile, readdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

// Only use SSL for remote databases (Neon), not for localhost
const isLocalDatabase = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocalDatabase ? false : {
    rejectUnauthorized: false
  }
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing database...');

    const migrationsDir = join(__dirname, 'migrations');

    // Check if migrations directory exists
    try {
      await access(migrationsDir);
    } catch {
      console.log('⚠️  No migrations directory found, creating basic schema...');
      // Fallback to basic schema if migrations don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS trucks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plate_number VARCHAR(50) NOT NULL,
          gps_number VARCHAR(50) UNIQUE NOT NULL,
          driver_name VARCHAR(100) NOT NULL,
          driver_phone VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'waiting',
          arrival_number INTEGER,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          speed DECIMAL(5, 2) DEFAULT 0,
          destination VARCHAR(100),
          cargo_type VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS geofences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          radius INTEGER NOT NULL,
          color VARCHAR(10) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Basic database schema initialized');
      return;
    }

    // Read all migration files
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      console.log(`📄 Running migration: ${file}`);
      const filePath = join(migrationsDir, file);
      const sql = await readFile(filePath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`✅ Migration ${file} completed`);
      } catch (error: any) {
        // Ignore errors for already existing objects
        if (error.code === '42P07' || error.code === '42710' || error.code === '42P16') {
          console.log(`⚠️  ${file}: Objects already exist, skipping...`);
        } else {
          console.error(`❌ Error in migration ${file}:`, error.message);
          // Don't throw, continue with other migrations
        }
      }
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
