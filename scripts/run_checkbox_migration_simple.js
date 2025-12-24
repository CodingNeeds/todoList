const { Client } = require('pg');

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

    // Try creating table with simpler SQL (no functions/triggers)
    console.log('🚀 Creating task_checkboxes table...\n');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_checkboxes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL,
          task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('exam', 'exercise')),
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          is_completed BOOLEAN DEFAULT false,
          position INTEGER DEFAULT 0,
          generated_by VARCHAR(20) DEFAULT 'manual' CHECK (generated_by IN ('llm', 'manual')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table created!\n');

    // Create indexes
    console.log('📊 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_checkboxes_task_student ON task_checkboxes(task_id, task_type, student_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_checkboxes_completed ON task_checkboxes(student_id, is_completed);`);
    console.log('✅ Indexes created!\n');

    // Insert sample data
    console.log('📝 Inserting sample data...');
    await client.query(`
      INSERT INTO task_checkboxes (task_id, task_type, student_id, title, position, generated_by) VALUES
          ('55551111-1111-1111-1111-111111111111', 'exercise', '33333333-3333-3333-3333-333333333333', 
           'Review binary tree concepts from lecture notes', 1, 'llm'),
          ('55551111-1111-1111-1111-111111111111', 'exercise', '33333333-3333-3333-3333-333333333333', 
           'Implement the BinaryNode class with left/right pointers', 2, 'llm'),
          ('55551111-1111-1111-1111-111111111111', 'exercise', '33333333-3333-3333-3333-333333333333', 
           'Implement insert() method for BST', 3, 'llm'),
          ('55551111-1111-1111-1111-111111111111', 'exercise', '33333333-3333-3333-3333-333333333333', 
           'Write unit tests for all operations', 4, 'llm'),
          ('eeee1111-1111-1111-1111-111111111111', 'exam', '33333333-3333-3333-3333-333333333333', 
           'Review sorting algorithms (bubble, merge, quick, heap)', 1, 'llm'),
          ('eeee1111-1111-1111-1111-111111111111', 'exam', '33333333-3333-3333-3333-333333333333', 
           'Practice Big-O complexity analysis', 2, 'llm')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Sample data inserted!\n');

    // Verify
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'task_checkboxes'
      ORDER BY ordinal_position;
    `);
    console.log('📋 Table columns:');
    console.table(columns.rows);

    const count = await client.query('SELECT COUNT(*) FROM task_checkboxes');
    console.log(`\n📊 Total rows: ${count.rows[0].count}`);

    const sample = await client.query('SELECT task_type, title, is_completed, generated_by FROM task_checkboxes');
    console.log('\n📝 All checkboxes:');
    console.table(sample.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detail:', error.detail || 'No additional details');
  } finally {
    await client.end();
    console.log('\n✅ Connection closed.');
  }
}

runMigration();
