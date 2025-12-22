/**
 * Insert sample data into existing tables
 * Works with the existing schema on Render
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

async function insertData() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // 1. Insert sample users (teachers and students)
    console.log('👤 Inserting users...');
    await client.query(`
      INSERT INTO users (id, nom, prenom, email, password, role) VALUES
        ('11111111-1111-1111-1111-111111111111', 'Johnson', 'Sarah', 'sarah.johnson@school.edu', 'hashed_pwd', 'teacher'),
        ('22222222-2222-2222-2222-222222222222', 'Chen', 'Michael', 'michael.chen@school.edu', 'hashed_pwd', 'teacher'),
        ('33333333-3333-3333-3333-333333333333', 'Martin', 'Alice', 'alice.martin@school.edu', 'hashed_pwd', 'student'),
        ('44444444-4444-4444-4444-444444444444', 'Wilson', 'Bob', 'bob.wilson@school.edu', 'hashed_pwd', 'student')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Users inserted\n');

    // 2. Insert sample modules
    console.log('📚 Inserting modules...');
    await client.query(`
      INSERT INTO modules (id, title, description, teacher_id) VALUES
        ('aaaa1111-1111-1111-1111-111111111111', 'Introduction to Computer Science', 'Fundamentals of programming and algorithms', '11111111-1111-1111-1111-111111111111'),
        ('bbbb2222-2222-2222-2222-222222222222', 'Advanced Mathematics', 'Linear algebra and calculus', '22222222-2222-2222-2222-222222222222'),
        ('cccc3333-3333-3333-3333-333333333333', 'Database Systems', 'SQL and database design principles', '11111111-1111-1111-1111-111111111111')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Modules inserted\n');

    // 3. Insert sample exams
    console.log('📝 Inserting exams...');
    await client.query(`
      INSERT INTO exams (id, title, description, duration, teacher_id, module_id, exam_date) VALUES
        ('eeee1111-1111-1111-1111-111111111111', 'Midterm Exam - Algorithms', 'Comprehensive exam covering sorting algorithms, data structures, and complexity analysis.', '2 hours', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '2025-12-28 14:00:00+00'),
        ('eeee2222-2222-2222-2222-222222222222', 'Final Exam - Linear Algebra', 'Matrix operations, eigenvalues, and vector spaces.', '3 hours', '22222222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', '2025-12-30 10:00:00+00')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Exams inserted\n');

    // 4. Insert sample exercises
    console.log('📋 Inserting exercises...');
    await client.query(`
      INSERT INTO exercises (id, module_id, teacher_id, title, description, file_url, deadline, is_published, exam_date) VALUES
        ('55551111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Programming Assignment: Binary Trees', 'Implement binary search tree with insert, delete, and traversal operations in Python.', 'https://example.com/bst-starter.py', '2025-12-26 23:59:00+00', true, '2025-12-26 23:59:00+00'),
        ('55552222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Linear Algebra Problem Set', 'Complete exercises 1-15 from Chapter 4. Show all work.', 'https://example.com/chapter4.pdf', '2025-12-24 23:59:00+00', true, '2025-12-24 23:59:00+00'),
        ('55553333-3333-3333-3333-333333333333', 'cccc3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'SQL Query Exercises', 'Write SQL queries for the given database scenarios.', 'https://example.com/sql-exercises.pdf', '2025-12-27 23:59:00+00', true, '2025-12-27 23:59:00+00')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Exercises inserted\n');

    // 5. Enroll students in modules
    console.log('🎓 Enrolling students...');
    await client.query(`
      INSERT INTO student_enrollments (student_id, module_id) VALUES
        ('33333333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111'),
        ('33333333-3333-3333-3333-333333333333', 'bbbb2222-2222-2222-2222-222222222222'),
        ('33333333-3333-3333-3333-333333333333', 'cccc3333-3333-3333-3333-333333333333'),
        ('44444444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Students enrolled\n');

    // Verify data
    console.log('📊 Record counts:');
    const counts = await client.query(`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL SELECT 'modules', COUNT(*) FROM modules
      UNION ALL SELECT 'exams', COUNT(*) FROM exams
      UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
      UNION ALL SELECT 'student_enrollments', COUNT(*) FROM student_enrollments
    `);
    counts.rows.forEach(row => console.log(`  - ${row.table_name}: ${row.count}`));

    console.log('\n🎉 Sample data inserted successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

insertData();
