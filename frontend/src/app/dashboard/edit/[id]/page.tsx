"use client";

/**
 * Edit Task page - dedicated page for editing existing tasks
 */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import Link from "next/link";

type Priority = "high" | "medium" | "low";

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
  priority: Priority;
  tags: string[];
  due_date?: string | null;
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
  recurrence_end_date?: string | null;
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const taskId = parseInt(params?.id as string);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    tags: [] as string[],
    due_date: null as Date | null,
    is_recurring: false,
    recurrence_pattern: null as "daily" | "weekly" | "monthly" | null,
    recurrence_end_date: null as Date | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch task details
  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiClient.getTask(taskId) as Promise<Task>,
    enabled: !!taskId && !isNaN(taskId),
  });

  // Populate form when task data loads
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority || "medium",
        tags: task.tags || [],
        due_date: task.due_date ? new Date(task.due_date) : null,
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || null,
        recurrence_end_date: task.recurrence_end_date ? new Date(task.recurrence_end_date) : null,
      });
    }
  }, [task]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      priority?: Priority;
      tags?: string[];
      due_date?: string | null;
      is_recurring?: boolean;
      recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
      recurrence_end_date?: string | null;
    }) => apiClient.updateTask(taskId, data) as Promise<Task>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      router.push("/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to update task");
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: () => apiClient.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.push("/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to delete task");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Title cannot be empty");
      return;
    }

    // Validate recurrence
    if (formData.is_recurring && !formData.recurrence_pattern) {
      setError("Please select a recurrence pattern (daily, weekly, or monthly)");
      return;
    }

    if (formData.is_recurring && !formData.due_date) {
      setError("Due date is required for recurring tasks");
      return;
    }

    updateTaskMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      due_date: formData.due_date ? formData.due_date.toISOString() : null,
      is_recurring: formData.is_recurring || undefined,
      recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
      recurrence_end_date: formData.is_recurring && formData.recurrence_end_date
        ? formData.recurrence_end_date.toISOString()
        : null,
    });
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate();
  };

  if (isNaN(taskId)) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Invalid task ID</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Task not found</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
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

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>

          {/* Title input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              disabled={updateTaskMutation.isPending}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              disabled={updateTaskMutation.isPending}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Priority and Due Date row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                disabled={updateTaskMutation.isPending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date & Time (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.due_date ? new Date(formData.due_date.getTime() - formData.due_date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value ? new Date(e.target.value) : null })}
                disabled={updateTaskMutation.isPending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags {formData.tags.length > 0 && `(${formData.tags.length}/10)`}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) })}
                    disabled={updateTaskMutation.isPending}
                    className="hover:text-blue-900 disabled:cursor-not-allowed"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                id="tag-input"
                placeholder="Add a tag..."
                disabled={updateTaskMutation.isPending || formData.tags.length >= 10}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const tag = input.value.trim();
                    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
                      setFormData({ ...formData, tags: [...formData.tags, tag] });
                      input.value = "";
                    }
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("tag-input") as HTMLInputElement;
                  const tag = input.value.trim();
                  if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
                    setFormData({ ...formData, tags: [...formData.tags, tag] });
                    input.value = "";
                  }
                }}
                disabled={updateTaskMutation.isPending || formData.tags.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Recurrence Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked, recurrence_pattern: e.target.checked ? formData.recurrence_pattern : null })}
                disabled={updateTaskMutation.isPending}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                Recurring Task
              </label>
            </div>

            {formData.is_recurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat Pattern *
                  </label>
                  <select
                    value={formData.recurrence_pattern || ""}
                    onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value as "daily" | "weekly" | "monthly" })}
                    disabled={updateTaskMutation.isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence_end_date ? new Date(formData.recurrence_end_date.getTime() - formData.recurrence_end_date.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ""}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value ? new Date(e.target.value) : null })}
                    disabled={updateTaskMutation.isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteTaskMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
            </button>
            <button
              type="submit"
              disabled={updateTaskMutation.isPending || !formData.title.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
              >
                {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
