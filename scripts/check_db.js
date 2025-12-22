/**
 * Check database permissions and existing objects
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

async function check() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check current user
    const user = await client.query('SELECT current_user, current_database()');
    console.log('Current user:', user.rows[0].current_user);
    console.log('Database:', user.rows[0].current_database);

    // Check available schemas
    console.log('\n📁 Available schemas:');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
    `);
    schemas.rows.forEach(r => console.log(`  - ${r.schema_name}`));

    // Check existing tables
    console.log('\n📋 Existing tables:');
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT LIKE 'pg_%' AND table_schema != 'information_schema'
      ORDER BY table_schema, table_name
    `);
    if (tables.rows.length === 0) {
      console.log('  (no tables found)');
    } else {
      tables.rows.forEach(r => console.log(`  - ${r.table_schema}.${r.table_name}`));
    }

    // Check schema permissions
    console.log('\n🔐 Schema privileges:');
    const privs = await client.query(`
      SELECT nspname, has_schema_privilege(current_user, nspname, 'CREATE') as can_create,
             has_schema_privilege(current_user, nspname, 'USAGE') as can_use
      FROM pg_namespace 
      WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
    `);
    privs.rows.forEach(r => console.log(`  - ${r.nspname}: CREATE=${r.can_create}, USAGE=${r.can_use}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
