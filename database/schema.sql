-- ============================================================================
-- POSTGRESQL SCHEMA FOR SCHOOL MODULES
-- ============================================================================
-- Run this script in your PostgreSQL database to create the required table
-- 
-- Prerequisites:
-- 1. PostgreSQL 13+ (for gen_random_uuid() support)
-- 2. A database created for your school platform
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MODULES TABLE
-- ============================================================================
-- Stores course modules created through the form
-- 
-- Columns:
-- - id: Auto-generated UUID primary key
-- - title: Module name (required, max 100 chars)
-- - description: Module description (required, max 500 chars)
-- - teacher_id: Reference to teacher (stored as string for flexibility)
-- - teacher_name: Denormalized teacher name for quick access
-- - created_at: Timestamp of creation
-- - updated_at: Timestamp of last update
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

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Add indexes for common query patterns

-- Index for searching by teacher
CREATE INDEX IF NOT EXISTS idx_modules_teacher_id ON modules(teacher_id);

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at DESC);

-- ============================================================================
-- OPTIONAL: TEACHERS TABLE (for future integration)
-- ============================================================================
-- Uncomment this section when you want to replace mock data with real teachers
-- 
-- CREATE TABLE IF NOT EXISTS teachers (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name VARCHAR(100) NOT NULL,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     department VARCHAR(100),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
-- 
-- -- Sample data for testing
-- INSERT INTO teachers (id, name, email, department) VALUES
--     ('t1', 'Dr. Sarah Johnson', 'sarah.johnson@school.edu', 'Computer Science'),
--     ('t2', 'Prof. Michael Chen', 'michael.chen@school.edu', 'Mathematics'),
--     ('t3', 'Ms. Emily Rodriguez', 'emily.rodriguez@school.edu', 'Literature'),
--     ('t4', 'Mr. David Kim', 'david.kim@school.edu', 'Physics'),
--     ('t5', 'Dr. Amanda Foster', 'amanda.foster@school.edu', 'Biology');

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
-- Stores student information for task assignments
-- 
-- Columns:
-- - id: Auto-generated UUID primary key
-- - name: Student full name
-- - email: Student email (unique)
-- - created_at: Timestamp of creation
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample students for testing
INSERT INTO students (id, name, email) VALUES
    ('s1', 'Alice Martin', 'alice.martin@school.edu'),
    ('s2', 'Bob Wilson', 'bob.wilson@school.edu'),
    ('s3', 'Carol Davis', 'carol.davis@school.edu')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
-- Stores tasks (exams and exercises) assigned by teachers
-- 
-- Columns:
-- - id: Auto-generated UUID primary key
-- - title: Task title (required, max 200 chars)
-- - description: Task description/instructions
-- - task_type: Either 'exam' or 'exercise'
-- - module_id: Foreign key to modules table
-- - assigned_by: Teacher ID who assigned the task
-- - assigned_by_name: Denormalized teacher name
-- - due_date: When the task is due
-- - resources: Array of resource URLs/file paths
-- - created_at: Timestamp of creation
-- - updated_at: Timestamp of last update
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

-- ============================================================================
-- STUDENT_TASKS TABLE (Junction Table)
-- ============================================================================
-- Links students to their assigned tasks with completion status
-- 
-- Columns:
-- - id: Auto-generated UUID primary key
-- - student_id: Foreign key to students table
-- - task_id: Foreign key to tasks table
-- - status: Task status (pending, in_progress, completed)
-- - completed_at: When the task was completed (null if not completed)
-- - created_at: Timestamp of assignment
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

-- ============================================================================
-- INDEXES FOR TASKS AND STUDENT_TASKS
-- ============================================================================

-- Index for filtering tasks by module
CREATE INDEX IF NOT EXISTS idx_tasks_module_id ON tasks(module_id);

-- Index for filtering/sorting tasks by due date
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Index for filtering tasks by type
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- Index for looking up student's tasks
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_id ON student_tasks(student_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON student_tasks(status);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_status ON student_tasks(student_id, status);

-- ============================================================================
-- VERIFY TABLE CREATION
-- ============================================================================
-- Run these queries to verify tables were created correctly:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'modules';
--
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks';
--
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'student_tasks';
