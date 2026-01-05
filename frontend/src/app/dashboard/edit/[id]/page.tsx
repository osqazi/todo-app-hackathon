"use client";

/**
 * Edit Task page - dedicated page for editing existing tasks
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { VibrantButton } from "@/components/ui/vibrant/VibrantButton";
import { VibrantCard, VibrantCardHeader, VibrantCardTitle, VibrantCardContent } from "@/components/ui/vibrant/VibrantCard";
import { VibrantInput } from "@/components/ui/vibrant/VibrantInput";
import { PrioritySelector, Priority as TaskPriority } from "@/components/tasks/PrioritySelector";
import DateTimePicker from "@/components/tasks/DateTimePicker";
import { TagInput } from "@/components/tasks/TagInput";
import RecurrenceConfig, { RecurrenceSettings } from "@/components/tasks/RecurrenceConfig";

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

  // Memoize recurrence value to avoid infinite loop - use timestamp for date comparison
  const recurrenceValue = useMemo(() => ({
    is_recurring: formData.is_recurring,
    recurrence_pattern: formData.recurrence_pattern,
    recurrence_end_date: formData.recurrence_end_date,
  }), [formData.is_recurring, formData.recurrence_pattern, formData.recurrence_end_date?.getTime()]);

  // Ref to store previous recurrence value to prevent unnecessary updates
  const prevRecurrenceValue = useRef(recurrenceValue);

  // Update the ref when formData changes to keep it in sync
  useEffect(() => {
    prevRecurrenceValue.current = {
      is_recurring: formData.is_recurring,
      recurrence_pattern: formData.recurrence_pattern,
      recurrence_end_date: formData.recurrence_end_date,
    };
  }, [formData.is_recurring, formData.recurrence_pattern, formData.recurrence_end_date]);

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Edit Task</h1>
        <Link
          href="/dashboard"
          className="text-sm text-slate-600 hover:text-slate-300 flex items-center gap-2"
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
        <div className="notification notification-error rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="card-vibrant mb-6 animate-fade-in">
          <VibrantCardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 012-2h9a2 2 0 01-2 2h-1z" />
                </svg>
              </div>
              <div>
                <VibrantCardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Edit Task
                </VibrantCardTitle>
                <p className="text-slate-500 dark:text-slate-400">
                  Update your existing task details
                </p>
              </div>
            </div>
          </VibrantCardHeader>

          <VibrantCardContent className="space-y-6">

          {/* Title input */}
          <VibrantInput
            type="text"
            label="Task Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What needs to be done?"
            disabled={updateTaskMutation.isPending}
          />

          {/* Description input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              disabled={updateTaskMutation.isPending}
              rows={3}
              className="input-vibrant w-full border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          {/* Priority and Due Date row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <PrioritySelector
                value={formData.priority}
                onChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                disabled={updateTaskMutation.isPending}
              />
            </div>
            <div>
              <DateTimePicker
                selected={formData.due_date}
                onChange={(date) => setFormData({ ...formData, due_date: date })}
                label="Due Date (optional)"
                minDate={new Date()}
                placeholderText="Select due date and time"
              />
            </div>
          </div>

          {/* Tags */}
          <TagInput
            tags={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
            disabled={updateTaskMutation.isPending}
            maxTags={10}
          />

          {/* Recurrence Configuration */}
          <RecurrenceConfig
            value={recurrenceValue}
            onChange={(value) => {
              // Only update if the values are actually different to prevent infinite loop
              const prevValue = prevRecurrenceValue.current;
              if (
                prevValue.is_recurring !== value.is_recurring ||
                prevValue.recurrence_pattern !== value.recurrence_pattern ||
                (prevValue.recurrence_end_date?.toISOString() !== value.recurrence_end_date?.toISOString())
              ) {
                setFormData(prev => ({
                  ...prev,
                  is_recurring: value.is_recurring,
                  recurrence_pattern: value.recurrence_pattern,
                  recurrence_end_date: value.recurrence_end_date,
                }));

                // Update the ref with new value
                prevRecurrenceValue.current = value;
              }
            }}
            disabled={updateTaskMutation.isPending}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <VibrantButton
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteTaskMutation.isPending}
              variant="danger"
              className="px-6 py-3 text-base font-semibold"
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
            </VibrantButton>
            <VibrantButton
              type="submit"
              disabled={updateTaskMutation.isPending || !formData.title.trim()}
              loading={updateTaskMutation.isPending}
              className="px-6 py-3 text-base font-semibold"
            >
              {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
            </VibrantButton>
          </div>
        </VibrantCardContent>
      </form>
    </div>

      {/* Help Text */}
      <VibrantCard className="animate-fade-in">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0"
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
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Tips</h3>
              <ul className="mt-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                <li>Use descriptive titles to easily identify tasks later</li>
                <li>Set priorities to help organize your work</li>
                <li>Add tags to group related tasks together</li>
                <li>Set due dates to receive reminders (requires notification permission)</li>
                <li>Configure recurring tasks for repeating activities</li>
              </ul>
            </div>
          </div>
        </div>
      </VibrantCard>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <VibrantCard className="max-w-md w-full animate-fade-in">
            <div className="p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">Delete Task?</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to delete "{task.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <VibrantButton
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                >
                  Cancel
                </VibrantButton>
                <VibrantButton
                  onClick={handleDelete}
                  disabled={deleteTaskMutation.isPending}
                  variant="danger"
                >
                  {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
                </VibrantButton>
              </div>
            </div>
          </VibrantCard>
        </div>
      )}
    </div>
  );
}
