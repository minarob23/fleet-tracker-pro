// Check current schema and run migration if needed
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkAndFix() {
    const connectionString = process.env.NEON_DATABASE_URL;

    if (!connectionString) {
        console.error('❌ NEON_DATABASE_URL environment variable is not set');
        console.log('Please make sure your .env file contains NEON_DATABASE_URL');
        process.exit(1);
    }

    const isLocalDatabase = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    const pool = new Pool({
        connectionString,
        ssl: isLocalDatabase ? false : {
            rejectUnauthorized: false
        }
    });

    try {
        // Check current schema
        console.log('🔍 Checking current schema...\n');
        const schemaCheck = await pool.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND data_type = 'numeric'
      ORDER BY column_name
    `);

        console.log('📊 All NUMERIC columns in trucks table:');
        schemaCheck.rows.forEach(row => {
            const status = (row.numeric_precision === 5 && row.numeric_scale === 2) ? '❌ TOO SMALL' : '✅ OK';
            console.log(`  ${status} ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
        });

        // Check if migration is needed
        const needsMigration = schemaCheck.rows.some(row =>
            ['latitude', 'longitude'].includes(row.column_name) &&
            row.numeric_precision === 5 &&
            row.numeric_scale === 2
        );

        if (needsMigration) {
            console.log('\n🔄 Running migration...');
            const migrationPath = path.join(__dirname, '006_fix_coordinate_precision.sql');
            const sql = fs.readFileSync(migrationPath, 'utf8');
            await pool.query(sql);
            console.log('✅ Migration completed!\n');

            // Verify again
            const verifyCheck = await pool.query(`
        SELECT column_name, data_type, numeric_precision, numeric_scale 
        FROM information_schema.columns 
        WHERE table_name = 'trucks' 
        AND column_name IN ('latitude', 'longitude')
        ORDER BY column_name
      `);

            console.log('📊 Updated columns:');
            verifyCheck.rows.forEach(row => {
                console.log(`  ✅ ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
            });
        } else {
            console.log('\n✅ Schema is already correct!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkAndFix();
