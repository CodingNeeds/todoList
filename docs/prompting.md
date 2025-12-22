# workflow : 
- afficher student todolist to students
- list contains tasks that are assigned by prof
- task could be exams and or exercises

- input :
    - module 
    - resources for each module 
    - execises & exams 
    - date  
- add filter : 
    - by module 
    - date 
- add sorting

---

## Plan: Student Todo List with Filtering & Sorting

Build a student todo list view in Next.js that fetches tasks (exams/exercises) from n8n webhooks connected to PostgreSQL. Tasks are assigned by professors per module, with filtering by module/date and sorting capabilities.

### Steps

1. **Extend PostgreSQL schema with tasks tables** — Add to `database/schema.sql`: `tasks` table (id, title, description, task_type [exam/exercise], module_id FK, assigned_by, due_date, resources[], timestamps) and `student_tasks` junction table (student_id, task_id, status [pending/in_progress/completed]). Add indexes for `module_id`, `due_date`, and `status` columns.

2. **Create n8n workflows for task operations** — Set up three webhooks in `n8n/student-tasks-workflow.json`: `GET /get-student-tasks` with query params for filtering (module_id, date_from, date_to, status), `PATCH /update-task-status` to toggle completion, and `GET /get-modules` to populate filter dropdown.

3. **Build self-contained `StudentTodoList.tsx` component** — Located in `src/components/`:
   - Webhook URL constants at top (clearly marked for configuration)
   - TypeScript interfaces for `Task`, `Filters`, and `SortOption`
   - Mock modules/tasks arrays (commented "Replace with n8n fetch")
   - Filter state: module dropdown, date range picker, task type toggle
   - Sorting controls: by due date, module, or status
   - Task cards with type badges (exam=red, exercise=purple), status indicators, overdue highlighting
   - Expandable resources section per task
   - Loading/empty/error states matching existing component patterns
   - Tailwind dark mode styling

4. **Create todo list page route** — Add `app/todos/page.tsx` that imports and renders `StudentTodoList` component.

### Files Created

| File | Description |
|------|-------------|
| `database/schema.sql` | Extended with students, tasks, and student_tasks tables |
| `src/components/StudentTodoList.tsx` | Main todo list component with filtering/sorting |
| `src/app/todos/page.tsx` | Page route at `/todos` |
| `n8n/student-tasks-workflow.json` | N8N workflow with 3 webhook endpoints |

### How to Use

1. **Run the updated schema** in PostgreSQL to create new tables
2. **Import the n8n workflow** from `n8n/student-tasks-workflow.json`
3. **Update PostgreSQL credentials** in the n8n workflow nodes
4. **Start the Next.js dev server**: `npm run dev`
5. **Visit** `http://localhost:3000/todos` to see the todo list

### Further Considerations

1. **Student authentication** — Currently uses mock student ID. Add student selector or integrate with auth system.

2. **Task creation form** — Add a separate form for professors to create and assign tasks.

3. **Real-time updates** — Uncomment the useEffect in StudentTodoList.tsx for live data fetching. 