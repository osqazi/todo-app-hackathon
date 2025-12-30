/**
 * Enhanced Task List component with search, filter, and sort support.
 *
 * Uses TanStack Query for data fetching with caching,
 * optimistic updates for mutations, and error handling.
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { FilterCriteria } from "./TaskFilters";
import { SortOptions } from "./SortSelector";

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
  priority: "high" | "medium" | "low";
  tags: string[];
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
  offset: number;
  limit: number;
  filters_applied: Record<string, any>;
}

interface TaskListProps {
  searchQuery?: string;
  filters?: FilterCriteria;
  sortOptions?: SortOptions;
}

export function TaskList({ searchQuery = "", filters = {}, sortOptions = { sort_by: "created_at", sort_order: "desc" } }: TaskListProps) {
  const queryClient = useQueryClient();
  const [completionMessage, setCompletionMessage] = useState<{
    message: string;
    taskTitle: string;
    nextDueDate?: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    taskId: number;
    taskTitle: string;
  } | null>(null);

  // Build query parameters
  const queryParams = {
    offset: 0,
    limit: 100,
    search: searchQuery || undefined,
    completed: filters.completed !== null && filters.completed !== undefined ? filters.completed : null,
    priority: filters.priority,
    tags: filters.tags,
    is_overdue: filters.is_overdue !== null && filters.is_overdue !== undefined ? filters.is_overdue : null,
    sort_by: sortOptions.sort_by,
    sort_order: sortOptions.sort_order,
  };

  // Fetch tasks query with filters
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", queryParams],
    queryFn: () => apiClient.getTasksFiltered(queryParams) as Promise<TaskListResponse>,
  });

  const tasks = response?.tasks || [];
  const totalCount = response?.total || 0;

  // Complete task mutation (US4 - T067)
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) =>
      apiClient.completeTask(taskId),
    onSuccess: (response, taskId) => {
      // Clear any existing message
      setCompletionMessage(null);

      // Show confirmation message if next instance was created (T068)
      if (response.next_instance) {
        const nextDueDate = response.next_instance.due_date
          ? new Date(response.next_instance.due_date).toLocaleString()
          : undefined;

        setCompletionMessage({
          message: "Task completed! Next instance created.",
          taskTitle: response.completed_task.title,
          nextDueDate,
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => setCompletionMessage(null), 10000);
      }
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousData = queryClient.getQueryData<TaskListResponse>(["tasks", queryParams]);

      if (previousData) {
        queryClient.setQueryData<TaskListResponse>(["tasks", queryParams], {
          ...previousData,
          tasks: previousData.tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: true, updated_at: new Date().toISOString() }
              : task
          ),
        });
      }

      return { previousData };
    },
    onError: (err, taskId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["tasks", queryParams], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => apiClient.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error("Failed to delete task:", error);
      setDeleteConfirm(null);
    },
  });

  const handleComplete = (taskId: number, isCompleted: boolean) => {
    // Only allow completing tasks (not un-completing)
    if (!isCompleted) {
      completeTaskMutation.mutate(taskId);
    }
  };

  const handleDeleteClick = (task: Task) => {
    setDeleteConfirm({
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteTaskMutation.mutate(deleteConfirm.taskId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading tasks: {error?.toString()}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Completion Confirmation Message (US4 - T068) */}
      {completionMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
          <button
            onClick={() => setCompletionMessage(null)}
            className="absolute top-2 right-2 text-green-600 hover:text-green-800"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-start gap-3 pr-8">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">
                {completionMessage.message}
              </h3>
              <p className="mt-1 text-sm text-green-700">
                <strong>{completionMessage.taskTitle}</strong>
                {completionMessage.nextDueDate && (
                  <> - Next due: {completionMessage.nextDueDate}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task Count */}
      <div className="text-sm text-gray-600">
        Showing {tasks.length} of {totalCount} tasks
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-2 text-gray-500">No tasks found</p>
          <p className="text-sm text-gray-400">
            {searchQuery || filters.completed !== null || filters.priority?.length
              ? "Try adjusting your filters"
              : "Create your first task to get started"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Priority Indicator */}
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityColor(
                    task.priority
                  )}`}
                  title={`Priority: ${task.priority}`}
                />

                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleComplete(task.id, task.completed)}
                  disabled={task.completed}
                  className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${
                          task.completed ? "line-through text-gray-400" : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p
                          className={`text-sm mt-1 ${
                            task.completed ? "line-through text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(task.created_at).toLocaleString()}
                      </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {/* Edit Button - Only show for incomplete tasks */}
                  {!task.completed && (
                    <Link
                      href={`/dashboard/edit/${task.id}`}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Link>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteClick(task)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete task"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{deleteConfirm.taskTitle}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteTaskMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
