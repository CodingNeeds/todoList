"use client";

/**
 * ============================================================================
 * STUDENT TODO LIST COMPONENT
 * ============================================================================
 * 
 * A self-contained component for displaying student tasks (exams & exercises).
 * Features filtering by module/date/status and sorting capabilities.
 * 
 * CONFIGURATION:
 * Update WEBHOOKS object with your n8n webhook URLs
 * 
 * BACKEND: n8n workflow with PostgreSQL
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from "react";

// ============================================================================
// 🔧 CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

/**
 * N8N Webhook URLs for task operations
 */
const WEBHOOKS = {
  GET_TASKS: "http://localhost:5678/webhook/get-student-tasks",
  UPDATE_STATUS: "http://localhost:5678/webhook/update-task-status",
  GET_MODULES: "http://localhost:5678/webhook/get-modules",
};

// Fallback student identifier for status updates when none is provided elsewhere
const DEFAULT_STUDENT_ID = "33333333-3333-3333-3333-333333333333";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TaskType = "exam" | "exercise";
type TaskStatus = "pending" | "in_progress" | "completed";
type SortOption = "dueDate" | "module" | "type" | "status";
type SortDirection = "asc" | "desc";

interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  moduleId: string;
  moduleName: string;
  assignedBy: string;
  assignedByName: string;
  dueDate: string;
  resources: string[];
  status: TaskStatus;
}

interface Module {
  id: string;
  title: string;
}

interface Filters {
  moduleId: string;
  taskType: "" | TaskType;
  status: "" | TaskStatus;
  dateFrom: string;
  dateTo: string;
}



// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isOverdue = (dateString: string, status: TaskStatus): boolean => {
  if (status === "completed") return false;
  return new Date(dateString) < new Date();
};

const getDaysUntilDue = (dateString: string): number => {
  const now = new Date();
  const due = new Date(dateString);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StudentTodoList() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    moduleId: "",
    taskType: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  // Sort states
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Expanded resources states
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // --------------------------------------------------------------------------
  // DATA FETCHING FROM N8N
  // --------------------------------------------------------------------------
  
  /**
   * Fetch tasks from n8n webhook
   */
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.moduleId) params.append("module_id", filters.moduleId);
        if (filters.status) params.append("status", filters.status);
        if (filters.dateFrom) params.append("date_from", filters.dateFrom);
        if (filters.dateTo) params.append("date_to", filters.dateTo);

        const url = `${WEBHOOKS.GET_TASKS}?${params}`;
        console.debug("Fetching tasks from:", url);

        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        // Read body text in case of non-JSON error responses
        const text = await response.text();

        if (!response.ok) {
          const body = text || response.statusText;
          const message = `HTTP ${response.status}: ${body}`;
          console.error("Task fetch failed:", message);
          throw new Error(message);
        }

        let data: any;
        try {
          data = text ? JSON.parse(text) : [];
        } catch (parseErr) {
          console.error("Failed to parse JSON response:", parseErr, "raw:", text);
          throw new Error("Invalid JSON response from tasks API");
        }

        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch tasks error:", err);
        setError(err instanceof Error ? err.message : "Failed to load tasks");
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [filters]);

  /**
   * Fetch modules from n8n webhook for filter dropdown
   */
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(WEBHOOKS.GET_MODULES, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        setModules(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch modules:", err);
      }
    };
    fetchModules();
  }, []);

  // --------------------------------------------------------------------------
  // FILTER & SORT LOGIC
  // --------------------------------------------------------------------------
  
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters
    if (filters.moduleId) {
      result = result.filter((t) => t.moduleId === filters.moduleId);
    }
    if (filters.taskType) {
      result = result.filter((t) => t.taskType === filters.taskType);
    }
    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter((t) => new Date(t.dueDate) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.dueDate) <= toDate);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "module":
          comparison = a.moduleName.localeCompare(b.moduleName);
          break;
        case "type":
          comparison = a.taskType.localeCompare(b.taskType);
          break;
        case "status":
          const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, filters, sortBy, sortDirection]);

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------
  
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(option);
      setSortDirection("asc");
    }
  };

  const toggleResources = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Store previous state for rollback
    const previousTasks = tasks;
    
    // Update local state immediately (optimistic update)
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Sync with n8n/PostgreSQL
    try {
      const response = await fetch(WEBHOOKS.UPDATE_STATUS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, studentId: DEFAULT_STUDENT_ID, status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      // Revert on error
      setTasks(previousTasks);
      setError("Failed to update task status");
    }
  };

  const clearFilters = () => {
    setFilters({
      moduleId: "",
      taskType: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------
  
  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    const labels = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type: TaskType) => {
    const styles = {
      exam: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      exercise: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    };
    const labels = {
      exam: "📝 Exam",
      exercise: "📚 Exercise",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Tasks
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track your exams and exercises assigned by your professors.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 dark:text-red-400 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Module
            </label>
            <select
              value={filters.moduleId}
              onChange={(e) => handleFilterChange("moduleId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white"
            >
              <option key="all-modules" value="">All Modules</option>
              {modules.map((m, idx) => (
                <option key={m.id || `${m.title || 'module'}-${idx}`} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.taskType}
              onChange={(e) => handleFilterChange("taskType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white"
            >
              <option key="all-types" value="">All Types</option>
              <option key="exam" value="exam">Exams</option>
              <option key="exercise" value="exercise">Exercises</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white"
            >
              <option key="all-statuses" value="">All Statuses</option>
              <option key="pending" value="pending">Pending</option>
              <option key="in_progress" value="in_progress">In Progress</option>
              <option key="completed" value="completed">Completed</option>
            </select>
          </div>

          {/* Date From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
        {(["dueDate", "module", "type", "status"] as SortOption[]).map((option) => (
          <button
            key={option}
            onClick={() => handleSortChange(option)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === option
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {option === "dueDate" ? "Due Date" : option.charAt(0).toUpperCase() + option.slice(1)}
            {sortBy === option && (
              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {Object.values(filters).some(Boolean)
              ? "Try adjusting your filters."
              : "You're all caught up!"}
          </p>
        </div>
      )}

      {/* Task List */}
      {!isLoading && filteredAndSortedTasks.length > 0 && (
        <div className="space-y-4">
          {filteredAndSortedTasks.map((task, idx) => {
            const overdue = isOverdue(task.dueDate, task.status);
            const daysUntil = getDaysUntilDue(task.dueDate);
            const isExpanded = expandedTasks.has(task.id);

            return (
              <div
                key={task.id || `${task.title || 'task'}-${idx}`}
                className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all
                  ${overdue
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                    : "border-gray-200 dark:border-gray-700"
                  }
                  ${task.status === "completed" ? "opacity-75" : ""}
                `}
              >
                {/* Task Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold ${
                      task.status === "completed"
                        ? "text-gray-500 dark:text-gray-400 line-through"
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.moduleName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getTypeBadge(task.taskType)}
                    {getStatusBadge(task.status)}
                  </div>
                </div>

                {/* Task Description */}
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {task.description}
                </p>

                {/* Task Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                      {formatDate(task.dueDate)}
                      {overdue && " (Overdue!)"}
                      {!overdue && task.status !== "completed" && daysUntil <= 3 && daysUntil >= 0 && (
                        <span className="text-orange-600 dark:text-orange-400"> ({daysUntil === 0 ? "Due today" : `${daysUntil} days left`})</span>
                      )}
                    </span>
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {task.assignedByName}
                  </span>
                </div>

                {/* Resources Section */}
                {(task.resources && task.resources.length > 0) && (
                  <div className="mb-3">
                    <button
                      onClick={() => toggleResources(task.id)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <svg className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {(task.resources?.length ?? 0)} Resource{(task.resources?.length ?? 0) > 1 ? "s" : ""}
                    </button>
                    {isExpanded && (
                      <ul className="mt-2 ml-5 space-y-1">
                        {(task.resources || []).map((resource, idx) => (
                          <li key={idx}>
                            <a
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {resource.split("/").pop() || resource}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Mark as:</span>
                  {(["pending", "in_progress", "completed"] as TaskStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(task.id, status)}
                      disabled={task.status === status}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        task.status === status
                          ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Developer Notes */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
            🔧 Developer Notes
          </h3>
          <ul className="text-xs text-yellow-700 dark:text-yellow-500 space-y-1">
            <li><strong>GET Tasks:</strong> {WEBHOOKS.GET_TASKS}</li>
            <li><strong>Update Status:</strong> {WEBHOOKS.UPDATE_STATUS}</li>
            <li><strong>Data:</strong> Currently using mock data (see MOCK_TASKS constant)</li>
            <li>Check the component file comments for n8n integration instructions.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
