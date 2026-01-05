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
  due_date: string | null;
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

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const isOverdue = (dueDate: string | null, completed: boolean) => {
    if (!dueDate || completed) return false;
    return new Date(dueDate) < new Date();
  };

  const getDueDateColor = (dueDate: string | null, completed: boolean) => {
    if (!dueDate) return "text-gray-400";
    if (completed) return "text-gray-400";
    if (isOverdue(dueDate, completed)) return "text-red-600 font-semibold";
    return "text-orange-600";
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
    <div className="space-y-6">
      {/* Completion Confirmation Message (US4 - T068) */}
      {completionMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                {completionMessage.message}
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                <strong className="font-medium">{completionMessage.taskTitle}</strong>
                {completionMessage.nextDueDate && (
                  <span className="block mt-1 text-green-600 dark:text-green-400">Next due: {completionMessage.nextDueDate}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setCompletionMessage(null)}
              className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Task Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{tasks.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> tasks
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {tasks.filter(t => !t.completed).length} pending, {tasks.filter(t => t.completed).length} completed
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg
              className="w-12 h-12 text-indigo-600 dark:text-indigo-400"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tasks found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery || filters.completed !== null || filters.priority?.length
              ? "Try adjusting your filters to see more tasks"
              : "Create your first task to get started on your productivity journey"}
          </p>
          {!searchQuery && filters.completed === null && !filters.priority?.length && !filters.tags?.length && (
            <div className="mt-6 animate-fade-in">
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Task
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className={`task-card transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 animate-fade-in ${task.completed ? 'opacity-80' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Priority Indicator */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${getPriorityColor(
                      task.priority
                    )} shadow-sm`}
                    title={`Priority: ${task.priority}`}
                  />
                  <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {task.priority.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleComplete(task.id, task.completed)}
                  disabled={task.completed}
                  className="mt-1 h-5 w-5 text-indigo-600 dark:text-indigo-500 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                />

                {/* Task Content */}
                <div className="flex-1 min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className={`text-lg font-semibold ${
                        task.completed
                          ? "line-through text-gray-500 dark:text-gray-500"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        task.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                          : task.priority === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p
                      className={`text-sm mt-2 ${
                        task.completed
                          ? "line-through text-gray-500 dark:text-gray-500"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                        >
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Due Date */}
                  {task.due_date && (
                    <div className={`text-sm mt-3 flex items-center gap-2 ${getDueDateColor(task.due_date, task.completed)} p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50`}>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="flex items-center gap-2">
                        Due: {new Date(task.due_date).toLocaleString()}
                        {isOverdue(task.due_date, task.completed) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 animate-pulse">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            OVERDUE
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Created: {new Date(task.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      {/* Edit Button - Only show for incomplete tasks */}
                      {!task.completed && (
                        <Link
                          href={`/dashboard/edit/${task.id}`}
                          className="inline-flex items-center justify-center p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                          title="Edit task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="inline-flex items-center justify-center p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                        title="Delete task"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all duration-200 scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Task</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>&quot;{deleteConfirm.taskTitle}&quot;</strong>? This action cannot be undone and the task will be permanently removed from your list.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteTaskMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteTaskMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-red-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteTaskMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
