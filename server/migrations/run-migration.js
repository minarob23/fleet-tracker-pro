// Quick script to run the coordinate precision migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Running migration: 006_fix_coordinate_precision.sql');

        const migrationPath = path.join(__dirname, '006_fix_coordinate_precision.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');

        // Verify the changes
        const result = await pool.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND column_name IN ('latitude', 'longitude')
      ORDER BY column_name
    `);

        console.log('\n📊 Updated column definitions:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
