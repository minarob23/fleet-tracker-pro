// One-time script to fix coordinate precision
// Run this with: node --env-file=.env server/migrations/fix-coords.mjs

import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
    console.error('❌ NEON_DATABASE_URL not found');
    process.exit(1);
}

const isLocalDatabase = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
    connectionString,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: false }
});

try {
    console.log('🔍 Checking schema...\n');

    const check = await pool.query(`
    SELECT column_name, numeric_precision, numeric_scale 
    FROM information_schema.columns 
    WHERE table_name = 'trucks' AND data_type = 'numeric'
    ORDER BY column_name
  `);

    console.log('Current NUMERIC columns:');
    check.rows.forEach(r => {
        const status = (r.numeric_precision === 5 && r.numeric_scale === 2) ? '❌' : '✅';
        console.log(`  ${status} ${r.column_name}: NUMERIC(${r.numeric_precision},${r.numeric_scale})`);
    });

    const needsFix = check.rows.some(r =>
        ['latitude', 'longitude'].includes(r.column_name) &&
        r.numeric_precision === 5
    );

    if (needsFix) {
        console.log('\n🔄 Fixing coordinate precision...');
        await pool.query('ALTER TABLE trucks ALTER COLUMN latitude TYPE NUMERIC(10, 7)');
        await pool.query('ALTER TABLE trucks ALTER COLUMN longitude TYPE NUMERIC(10, 7)');
        console.log('✅ Fixed!\n');

        const verify = await pool.query(`
      SELECT column_name, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name IN ('latitude', 'longitude')
    `);

        verify.rows.forEach(r => {
            console.log(`  ✅ ${r.column_name}: NUMERIC(${r.numeric_precision},${r.numeric_scale})`);
        });
    } else {
        console.log('\n✅ Already correct!');
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} finally {
    await pool.end();
}
