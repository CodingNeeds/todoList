const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d52n98u3jp1c73c7v2jg-a.virginia-postgres.render.com',
  database: 'n8n_school_ozeh',
  user: 'drari_grp1_ids',
  password: 'eoi6879)(*&&!#164etejcbvf0978^&#$@!?>"}{9895t4efdDEPTRHHhjhfo',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkPermissions() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check current user
    const userResult = await client.query('SELECT current_user, session_user');
    console.log('👤 Current user:', userResult.rows[0]);

    // Check if we can SELECT from tables
    console.log('\n📊 Can SELECT from tables:');
    const tables = ['users', 'modules', 'exams', 'exercises', 'student_answer', 'student_enrollments', 'resources'];
    for (const table of tables) {
      try {
        await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`  ✅ ${table}: YES`);
      } catch (e) {
        console.log(`  ❌ ${table}: NO - ${e.message}`);
      }
    }

    // Check if we can INSERT
    console.log('\n📝 Can INSERT into tables:');
    try {
      // Try to insert into student_answer (we know this works from n8n workflow)
      await client.query(`
        INSERT INTO student_answer (exercise_id, student_id, url_pdf, score, message)
        VALUES ('55551111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'test-permission-check', NULL, 'Permission test')
        ON CONFLICT DO NOTHING
      `);
      console.log('  ✅ student_answer: YES');
    } catch (e) {
      console.log(`  ❌ student_answer: NO - ${e.message}`);
    }

    // Check schema privileges
    console.log('\n🔒 Schema privileges:');
    const schemaPrivs = await client.query(`
      SELECT nspname, has_schema_privilege(current_user, nspname, 'CREATE') as can_create,
             has_schema_privilege(current_user, nspname, 'USAGE') as can_use
      FROM pg_namespace 
      WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema';
    `);
    console.table(schemaPrivs.rows);

    // Check table privileges
    console.log('\n🔒 Table privileges on users table:');
    const tablePrivs = await client.query(`
      SELECT privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_name = 'users' AND grantee = current_user;
    `);
    console.log('Privileges:', tablePrivs.rows.map(r => r.privilege_type).join(', ') || 'None explicitly granted');

    // Check if task_checkboxes already exists (maybe created by another user)
    console.log('\n🔍 Checking if task_checkboxes exists:');
    const checkTable = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'task_checkboxes';
    `);
    if (checkTable.rows.length > 0) {
      console.log('✅ Table task_checkboxes ALREADY EXISTS!');
      const cols = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns 
        WHERE table_name = 'task_checkboxes' ORDER BY ordinal_position;
      `);
      console.table(cols.rows);
    } else {
      console.log('❌ Table task_checkboxes does NOT exist');
    }

    // Check database owner
    console.log('\n👑 Database owner:');
    const ownerResult = await client.query(`
      SELECT d.datname, pg_catalog.pg_get_userbyid(d.datdba) as owner
      FROM pg_catalog.pg_database d
      WHERE d.datname = current_database();
    `);
    console.table(ownerResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Connection closed.');
  }
}

checkPermissions();
