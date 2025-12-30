"use client";

/**
 * New Task page - dedicated page for creating tasks
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { TaskForm } from "@/components/tasks/TaskForm";
import Link from "next/link";

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
  priority: "high" | "medium" | "low";
  tags: string[];
}

export default function NewTaskPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      priority?: "high" | "medium" | "low";
      tags?: string[];
      due_date?: string | null;
      is_recurring?: boolean;
      recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
      recurrence_end_date?: string | null;
    }) => apiClient.createTask(data) as Promise<Task>,
    onSuccess: () => {
      // Invalidate tasks cache to refetch on dashboard
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Navigate back to dashboard
      router.push("/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create task");
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Task Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <TaskForm
          onSubmit={(data) => createTaskMutation.mutate({
            ...data,
            due_date: data.due_date ? data.due_date.toISOString() : null,
            recurrence_end_date: data.recurrence_end_date ? data.recurrence_end_date.toISOString() : null,
          })}
          isSubmitting={createTaskMutation.isPending}
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Quick Tips</h3>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Use descriptive titles to easily identify tasks later</li>
              <li>Set priorities to help organize your work</li>
              <li>Add tags to group related tasks together</li>
              <li>Set due dates to receive reminders (requires notification permission)</li>
              <li>Configure recurring tasks for repeating activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
