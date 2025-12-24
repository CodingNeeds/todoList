const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d52n98u3jp1c73c7v2jg-a.virginia-postgres.render.com',
  database: 'n8n_school_ozeh',
  user: 'drari_grp1_ids',
  password: 'eoi6879)(*&&!#164etejcbvf0978^&#$@!?>"}{9895t4efdDEPTRHHhjhfo',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function auditDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!\n');

    // 1. List all tables
    console.log('=' .repeat(60));
    console.log('📋 ALL TABLES IN DATABASE');
    console.log('=' .repeat(60));
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables found:', tablesResult.rows.map(r => r.table_name).join(', '));
    console.log('Total tables:', tablesResult.rows.length);

    // 2. For each table, get schema
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TABLE SCHEMAS AND DATA');
    console.log('=' .repeat(60));

    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      console.log(`\n--- TABLE: ${tableName} ---`);
      
      // Get columns
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log('Columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`Row count: ${countResult.rows[0].count}`);

      // Get sample data (first 3 rows)
      try {
        const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
        if (sampleResult.rows.length > 0) {
          console.log('Sample data:');
          sampleResult.rows.forEach((row, i) => {
            console.log(`  Row ${i + 1}:`, JSON.stringify(row, null, 2).substring(0, 500));
          });
        }
      } catch (e) {
        console.log('Could not fetch sample data:', e.message);
      }
    }

    // 3. Check specific audit points
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 AUDIT SPECIFIC CHECKS');
    console.log('=' .repeat(60));

    // Check if tasks table has student_id
    console.log('\n--- CHECK 1: Does tasks table have student_id? ---');
    const tasksColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
    `);
    const tasksColumns = tasksColumnsResult.rows.map(r => r.column_name);
    console.log('Tasks table columns:', tasksColumns.join(', '));
    console.log('Has student_id:', tasksColumns.includes('student_id') ? 'YES ✅' : 'NO ❌');

    // Check if there's a student_tasks junction table
    console.log('\n--- CHECK 2: Student-Task relationship tables ---');
    const studentTasksExists = tablesResult.rows.some(r => r.table_name === 'student_tasks');
    console.log('student_tasks table exists:', studentTasksExists ? 'YES ✅' : 'NO ❌');

    // Check if exams table exists and has structure
    console.log('\n--- CHECK 3: Exams table structure ---');
    const examsColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'exams'
    `);
    if (examsColumnsResult.rows.length > 0) {
      console.log('Exams table exists ✅');
      console.log('Columns:', examsColumnsResult.rows.map(r => `${r.column_name}:${r.data_type}`).join(', '));
    } else {
      console.log('Exams table does NOT exist ❌');
    }

    // Check if exercises table exists
    console.log('\n--- CHECK 4: Exercises table structure ---');
    const exercisesColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'exercises'
    `);
    if (exercisesColumnsResult.rows.length > 0) {
      console.log('Exercises table exists ✅');
      console.log('Columns:', exercisesColumnsResult.rows.map(r => `${r.column_name}:${r.data_type}`).join(', '));
    } else {
      console.log('Exercises table does NOT exist ❌');
    }

    // Check users table
    console.log('\n--- CHECK 5: Users table structure ---');
    const usersColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    if (usersColumnsResult.rows.length > 0) {
      console.log('Users table exists ✅');
      console.log('Columns:', usersColumnsResult.rows.map(r => `${r.column_name}:${r.data_type}`).join(', '));
      
      // Check user roles
      const usersResult = await client.query(`SELECT id, nom, prenom, role FROM users LIMIT 5`);
      console.log('Sample users:', usersResult.rows);
    } else {
      console.log('Users table does NOT exist ❌');
    }

    // Check for any checkbox/subtask related tables
    console.log('\n--- CHECK 6: Checkbox/Subtask tables ---');
    const subtaskTables = tablesResult.rows.filter(r => 
      r.table_name.includes('subtask') || 
      r.table_name.includes('checkbox') || 
      r.table_name.includes('todo') ||
      r.table_name.includes('checklist')
    );
    if (subtaskTables.length > 0) {
      console.log('Subtask/Checkbox tables found:', subtaskTables.map(r => r.table_name).join(', '));
    } else {
      console.log('No dedicated subtask/checkbox tables found ❌');
    }

    // Check student_answer table
    console.log('\n--- CHECK 7: student_answer table ---');
    const studentAnswerResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'student_answer'
    `);
    if (studentAnswerResult.rows.length > 0) {
      console.log('student_answer table exists ✅');
      console.log('Columns:', studentAnswerResult.rows.map(r => `${r.column_name}:${r.data_type}`).join(', '));
    } else {
      console.log('student_answer table does NOT exist ❌');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed.');
  }
}

auditDatabase();
