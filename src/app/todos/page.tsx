import StudentTodoList from "@/components/StudentTodoList";

/**
 * Student Todo List Page
 * 
 * Displays assigned tasks (exams and exercises) for students
 * with filtering and sorting capabilities.
 * 
 * Route: /todos
 */
export default function TodosPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <StudentTodoList />
    </main>
  );
}
