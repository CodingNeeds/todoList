const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'dpg-d52n98u3jp1c73c7v2jg-a.virginia-postgres.render.com',
  database: 'n8n_school_ozeh',
  user: 'drari_grp1_ids',
  password: 'eoi6879)(*&&!#164etejcbvf0978^&#$@!?>"}{9895t4efdDEPTRHHhjhfo',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read and execute the migration SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'add_checkboxes_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Running migration...\n');
    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');

    // Verify the table was created
    console.log('📋 Verifying table structure:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'task_checkboxes'
      ORDER BY ordinal_position;
    `);
    console.table(columns.rows);

    // Check row count
    const count = await client.query('SELECT COUNT(*) FROM task_checkboxes');
    console.log(`\n📊 Rows in task_checkboxes: ${count.rows[0].count}`);

    // Show sample data
    const sample = await client.query('SELECT id, task_type, title, is_completed, generated_by FROM task_checkboxes LIMIT 5');
    if (sample.rows.length > 0) {
      console.log('\n📝 Sample checkboxes:');
      console.table(sample.rows);
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Connection closed.');
  }
}

runMigration();
