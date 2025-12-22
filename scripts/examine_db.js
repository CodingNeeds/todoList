/**
 * Examine existing database structure
 */

const { Client } = require('pg');

const config = {
  host: 'dpg-d52n98u3jp1c73c7v2jg-a.virginia-postgres.render.com',
  database: 'n8n_school_ozeh',
  user: 'drari_grp1_ids',
  password: 'eoi6879)(*&&!#164etejcbvf0978^&#$@!?>"}{9895t4efdDEPTRHHhjhfo',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

async function examine() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    const tables = ['modules', 'exams', 'exercises', 'resources', 'users', 'student_enrollments', 'student_answer'];

    for (const table of tables) {
      console.log(`\n📋 TABLE: ${table}`);
      console.log('='.repeat(50));
      
      const cols = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      cols.rows.forEach(c => {
        console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`);
      });

      // Count records
      try {
        const count = await client.query(`SELECT COUNT(*) as cnt FROM ${table}`);
        console.log(`  📊 Records: ${count.rows[0].cnt}`);
      } catch (e) {
        console.log(`  📊 Records: (could not count)`);
      }
    }

    // Check for sample data
    console.log('\n\n📝 SAMPLE DATA FROM modules:');
    const modules = await client.query('SELECT * FROM modules LIMIT 3');
    console.log(JSON.stringify(modules.rows, null, 2));

    console.log('\n📝 SAMPLE DATA FROM exams:');
    const exams = await client.query('SELECT * FROM exams LIMIT 3');
    console.log(JSON.stringify(exams.rows, null, 2));

    console.log('\n📝 SAMPLE DATA FROM exercises:');
    const exercises = await client.query('SELECT * FROM exercises LIMIT 3');
    console.log(JSON.stringify(exercises.rows, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

examine();
