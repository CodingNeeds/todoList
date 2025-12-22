/**
 * Test the query that n8n will use
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

async function testQuery() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // This is the exact query n8n should use
    const result = await client.query(`
      WITH all_tasks AS (
        SELECT 
          e.id,
          e.title,
          e.description,
          'exam' as "taskType",
          e.module_id as "moduleId",
          m.title as "moduleName",
          e.teacher_id::text as "assignedBy",
          COALESCE(u.prenom || ' ' || u.nom, 'Unknown Teacher') as "assignedByName",
          e.exam_date as "dueDate",
          ARRAY[]::text[] as resources,
          'pending' as status
        FROM exams e
        LEFT JOIN modules m ON e.module_id = m.id
        LEFT JOIN users u ON e.teacher_id = u.id
        
        UNION ALL
        
        SELECT 
          ex.id,
          ex.title,
          ex.description,
          'exercise' as "taskType",
          ex.module_id as "moduleId",
          m.title as "moduleName",
          ex.teacher_id::text as "assignedBy",
          COALESCE(u.prenom || ' ' || u.nom, 'Unknown Teacher') as "assignedByName",
          ex.deadline as "dueDate",
          ARRAY[ex.file_url] as resources,
          CASE 
            WHEN sa.id IS NOT NULL THEN 'completed'
            ELSE 'pending'
          END as status
        FROM exercises ex
        LEFT JOIN modules m ON ex.module_id = m.id
        LEFT JOIN users u ON ex.teacher_id = u.id
        LEFT JOIN student_answer sa ON ex.id = sa.exercise_id
        WHERE ex.is_published = true
      )
      SELECT * FROM all_tasks
      ORDER BY "dueDate" ASC
    `);

    console.log('📋 Tasks found:', result.rows.length);
    console.log('\n📝 Task data (this is what the API will return):');
    console.log(JSON.stringify(result.rows, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

testQuery();
