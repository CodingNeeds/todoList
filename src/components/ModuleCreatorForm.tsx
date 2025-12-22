"use client";

/**
 * ============================================================================
 * MODULE CREATOR FORM COMPONENT
 * ============================================================================
 * 
 * A self-contained form component for creating school modules.
 * This component includes ALL logic in one file for easy integration.
 * 
 * INTEGRATION POINTS (marked with 🔧):
 * 1. N8N_WEBHOOK_URL - Update with your n8n webhook URL
 * 2. MOCK_TEACHERS - Replace with PostgreSQL fetch when ready
 * 
 * BACKEND: n8n workflow with PostgreSQL
 * ============================================================================
 */

import React, { useState } from "react";

// ============================================================================
// 🔧 CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

/**
 * N8N Webhook URL for creating modules
 * 
 * HOW TO GET THIS URL:
 * 1. Open n8n (usually at http://localhost:5678)
 * 2. Create a new workflow
 * 3. Add a Webhook node as the trigger
 * 4. Set HTTP Method to POST
 * 5. Set Path to "create-module"
 * 6. Copy the "Test URL" or "Production URL"
 * 
 * Local development URL format: http://localhost:5678/webhook/create-module
 * Production URL format: http://localhost:5678/webhook-test/create-module (for testing)
 */
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/create-module";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Teacher interface - matches expected PostgreSQL schema
 * When replacing mock data, ensure your API returns this structure
 */
interface Teacher {
  id: string;
  name: string;
}

/**
 * Module form data interface
 * This is what gets sent to the n8n webhook
 */
interface ModuleFormData {
  title: string;
  description: string;
  teacherId: string;
  teacherName: string; // Included for easier data handling in n8n
}

/**
 * Form validation errors interface
 */
interface FormErrors {
  title?: string;
  description?: string;
  teacherId?: string;
}

/**
 * API response interface from n8n webhook
 */
interface ApiResponse {
  success: boolean;
  message?: string;
  moduleId?: string;
}

// ============================================================================
// 🔧 MOCK TEACHERS DATA - REPLACE WITH POSTGRESQL FETCH
// ============================================================================

/**
 * Mock teachers data for dropdown
 * 
 * TO REPLACE WITH POSTGRESQL:
 * 
 * Option 1: Using useEffect + fetch (client-side)
 * ---------------------------------------------
 * const [teachers, setTeachers] = useState<Teacher[]>([]);
 * 
 * useEffect(() => {
 *   const fetchTeachers = async () => {
 *     try {
 *       // Create another n8n webhook that queries PostgreSQL:
 *       // SELECT id, name FROM teachers ORDER BY name
 *       const response = await fetch("http://localhost:5678/webhook/get-teachers");
 *       const data = await response.json();
 *       setTeachers(data);
 *     } catch (error) {
 *       console.error("Failed to fetch teachers:", error);
 *     }
 *   };
 *   fetchTeachers();
 * }, []);
 * 
 * Option 2: Server Component + Props (recommended for production)
 * ---------------------------------------------------------------
 * Pass teachers as props from a server component that fetches from DB
 * 
 */
const MOCK_TEACHERS: Teacher[] = [
  { id: "t1", name: "Dr. Sarah Johnson" },
  { id: "t2", name: "Prof. Michael Chen" },
  { id: "t3", name: "Ms. Emily Rodriguez" },
  { id: "t4", name: "Mr. David Kim" },
  { id: "t5", name: "Dr. Amanda Foster" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ModuleCreatorForm() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Form field states
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Teachers data - currently using mock data
  // 🔧 Replace MOCK_TEACHERS with state + useEffect for PostgreSQL integration
  const teachers: Teacher[] = MOCK_TEACHERS;

  // --------------------------------------------------------------------------
  // VALIDATION LOGIC
  // --------------------------------------------------------------------------
  
  /**
   * Validates all form fields
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Module title is required";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Teacher validation
    if (!selectedTeacherId) {
      newErrors.teacherId = "Please select a teacher";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------------------------------------------------
  // FORM SUBMISSION HANDLER
  // --------------------------------------------------------------------------
  
  /**
   * Handles form submission
   * Sends data to n8n webhook which inserts into PostgreSQL
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset previous states
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Find selected teacher name for the payload
    const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
    
    // Prepare form data payload
    const formData: ModuleFormData = {
      title: title.trim(),
      description: description.trim(),
      teacherId: selectedTeacherId,
      teacherName: selectedTeacher?.name || "",
    };

    setIsSubmitting(true);

    try {
      // --------------------------------------------------------------------------
      // 🔧 API CALL TO N8N WEBHOOK
      // --------------------------------------------------------------------------
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Read response text (to capture error messages sent as JSON or plain text)
      const text = await response.text();

      // Try to parse JSON from response body
      let result: ApiResponse;
      try {
        result = text ? JSON.parse(text) : ({} as ApiResponse);
      } catch (err) {
        // If the server returned non-JSON and the status is not OK, throw with raw text
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${text}`);
        }
        throw new Error(`Invalid JSON response from server: ${text}`);
      }

      // If HTTP status is not OK, prefer server-provided message
      if (!response.ok) {
        const serverMessage = result?.message || result?.error || result?.description;
        throw new Error(serverMessage || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        // Success - reset form
        setSubmitSuccess(true);
        setTitle("");
        setDescription("");
        setSelectedTeacherId("");
        setErrors({});
        
        // Clear success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        // API returned success: false
        throw new Error(result.message || "Failed to create module");
      }
    } catch (error) {
      // Handle errors
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // HELPER FUNCTION - Clear field error on input
  // --------------------------------------------------------------------------
  
  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Module
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Fill in the details below to create a new course module.
        </p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-700 dark:text-green-400 font-medium">
              Module created successfully!
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 dark:text-red-400 font-medium">
              {submitError}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Module Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearFieldError("title");
            }}
            placeholder="e.g., Introduction to Computer Science"
            className={`w-full px-4 py-3 border rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:text-white dark:border-gray-600
              ${errors.title 
                ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                : "border-gray-300"
              }`}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearFieldError("description");
            }}
            placeholder="Provide a detailed description of the module content and objectives..."
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg shadow-sm resize-none
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:text-white dark:border-gray-600
              ${errors.description 
                ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                : "border-gray-300"
              }`}
            disabled={isSubmitting}
          />
          <div className="mt-1 flex justify-between">
            {errors.description ? (
              <p className="text-sm text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-sm text-gray-500">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Teacher Dropdown */}
        <div>
          <label
            htmlFor="teacher"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Assigned Teacher <span className="text-red-500">*</span>
          </label>
          <select
            id="teacher"
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
              clearFieldError("teacherId");
            }}
            className={`w-full px-4 py-3 border rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:text-white dark:border-gray-600
              ${errors.teacherId 
                ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                : "border-gray-300"
              }`}
            disabled={isSubmitting}
          >
            <option value="">Select a teacher...</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          {errors.teacherId && (
            <p className="mt-1 text-sm text-red-500">{errors.teacherId}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-6 text-white font-semibold rounded-lg shadow-md
              transition-all duration-200 ease-in-out
              ${isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:bg-blue-800"
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Module...
              </span>
            ) : (
              "Create Module"
            )}
          </button>
        </div>
      </form>

      {/* Integration Notes (visible in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
            🔧 Developer Notes
          </h3>
          <ul className="text-xs text-yellow-700 dark:text-yellow-500 space-y-1">
            <li>
              <strong>Webhook URL:</strong> {N8N_WEBHOOK_URL}
            </li>
            <li>
              <strong>Teachers:</strong> Currently using mock data (see MOCK_TEACHERS constant)
            </li>
            <li>
              Check the component file comments for PostgreSQL integration instructions.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
