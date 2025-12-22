/**
 * Database Setup Script
 * Creates all required tables for the school module system
 * 
 * Run with: node scripts/setup_all_tables.js
 */

const { Client } = require('pg');

// Database configuration
const config = {
  host: 'dpg-d52n98u3jp1c73c7v2jg-a.virginia-postgres.render.com',
  database: 'n8n_school_ozeh',
  user: 'drari_grp1_ids',
  password: 'eoi6879)(*&&!#164etejcbvf0978^&#$@!?>"}{9895t4efdDEPTRHHhjhfo',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

const schema = `
-- Note: pgcrypto extension is pre-installed on Render PostgreSQL

-- ============================================================================
-- MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    teacher_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for modules
CREATE INDEX IF NOT EXISTS idx_modules_teacher_id ON modules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at DESC);

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('exam', 'exercise')),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    assigned_by VARCHAR(50) NOT NULL,
    assigned_by_name VARCHAR(100) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    resources TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_module_id ON tasks(module_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- ============================================================================
-- STUDENT_TASKS TABLE (Junction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, task_id)
);

-- Indexes for student_tasks
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_id ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON student_tasks(status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_status ON student_tasks(student_id, status);
`;

const sampleData = `
-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample students (only if not exists)
INSERT INTO students (id, name, email) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Alice Martin', 'alice.martin@school.edu'),
    ('b2222222-2222-2222-2222-222222222222', 'Bob Wilson', 'bob.wilson@school.edu'),
    ('c3333333-3333-3333-3333-333333333333', 'Carol Davis', 'carol.davis@school.edu')
ON CONFLICT (email) DO NOTHING;

-- Insert sample module (only if table is empty)
INSERT INTO modules (id, title, description, teacher_id, teacher_name)
SELECT 
    'm1111111-1111-1111-1111-111111111111',
    'Introduction to Computer Science',
    'Fundamentals of programming and algorithms',
    't1',
    'Dr. Sarah Johnson'
WHERE NOT EXISTS (SELECT 1 FROM modules WHERE id = 'm1111111-1111-1111-1111-111111111111');

INSERT INTO modules (id, title, description, teacher_id, teacher_name)
SELECT 
    'm2222222-2222-2222-2222-222222222222',
    'Advanced Mathematics',
    'Linear algebra and calculus',
    't2',
    'Prof. Michael Chen'
WHERE NOT EXISTS (SELECT 1 FROM modules WHERE id = 'm2222222-2222-2222-2222-222222222222');

-- Insert sample tasks
INSERT INTO tasks (id, title, description, task_type, module_id, assigned_by, assigned_by_name, due_date, resources)
SELECT 
    't1111111-1111-1111-1111-111111111111',
    'Midterm Exam - Algorithms',
    'Comprehensive exam covering sorting algorithms, data structures, and complexity analysis.',
    'exam',
    'm1111111-1111-1111-1111-111111111111',
    't1',
    'Dr. Sarah Johnson',
    '2025-12-28 14:00:00+00',
    ARRAY['https://example.com/study-guide.pdf']
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE id = 't1111111-1111-1111-1111-111111111111');

INSERT INTO tasks (id, title, description, task_type, module_id, assigned_by, assigned_by_name, due_date, resources)
SELECT 
    't2222222-2222-2222-2222-222222222222',
    'Linear Algebra Problem Set',
    'Complete exercises 1-15 from Chapter 4. Show all work.',
    'exercise',
    'm2222222-2222-2222-2222-222222222222',
    't2',
    'Prof. Michael Chen',
    '2025-12-24 23:59:00+00',
    ARRAY['https://example.com/chapter4.pdf']
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE id = 't2222222-2222-2222-2222-222222222222');

INSERT INTO tasks (id, title, description, task_type, module_id, assigned_by, assigned_by_name, due_date, resources)
SELECT 
    't3333333-3333-3333-3333-333333333333',
    'Programming Assignment: Binary Trees',
    'Implement binary search tree with insert, delete, and traversal operations.',
    'exercise',
    'm1111111-1111-1111-1111-111111111111',
    't1',
    'Dr. Sarah Johnson',
    '2025-12-26 23:59:00+00',
    ARRAY['https://example.com/bst-starter.py']
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE id = 't3333333-3333-3333-3333-333333333333');

-- Assign tasks to students
INSERT INTO student_tasks (student_id, task_id, status)
SELECT 'a1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'pending'
WHERE NOT EXISTS (
    SELECT 1 FROM student_tasks 
    WHERE student_id = 'a1111111-1111-1111-1111-111111111111' 
    AND task_id = 't1111111-1111-1111-1111-111111111111'
);

INSERT INTO student_tasks (student_id, task_id, status)
SELECT 'a1111111-1111-1111-1111-111111111111', 't2222222-2222-2222-2222-222222222222', 'in_progress'
WHERE NOT EXISTS (
    SELECT 1 FROM student_tasks 
    WHERE student_id = 'a1111111-1111-1111-1111-111111111111' 
    AND task_id = 't2222222-2222-2222-2222-222222222222'
);

INSERT INTO student_tasks (student_id, task_id, status)
SELECT 'a1111111-1111-1111-1111-111111111111', 't3333333-3333-3333-3333-333333333333', 'pending'
WHERE NOT EXISTS (
    SELECT 1 FROM student_tasks 
    WHERE student_id = 'a1111111-1111-1111-1111-111111111111' 
    AND task_id = 't3333333-3333-3333-3333-333333333333'
);
`;

async function setup() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📦 Creating tables...');
    await client.query(schema);
    console.log('✅ Tables created!\n');

    console.log('📝 Inserting sample data...');
    await client.query(sampleData);
    console.log('✅ Sample data inserted!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables created:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Count records
    console.log('\n📊 Record counts:');
    const counts = await client.query(`
      SELECT 'modules' as table_name, COUNT(*) as count FROM modules
      UNION ALL
      SELECT 'students', COUNT(*) FROM students
      UNION ALL
      SELECT 'tasks', COUNT(*) FROM tasks
      UNION ALL
      SELECT 'student_tasks', COUNT(*) FROM student_tasks
    `);
    counts.rows.forEach(row => console.log(`  - ${row.table_name}: ${row.count} records`));

    console.log('\n🎉 Database setup complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
