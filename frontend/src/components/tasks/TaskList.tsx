/**
 * Task List component - displays and manages tasks.
 *
 * Uses TanStack Query for data fetching with caching,
 * optimistic updates for mutations, and error handling.
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { TaskForm } from "./TaskForm";

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
}

export function TaskList() {
  const queryClient = useQueryClient();
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Fetch tasks query
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiClient.getTasks() as Promise<Task[]>,
  });

  // Create task mutation with optimistic update
  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      apiClient.createTask(data) as Promise<Task>,
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      // Optimistically update with a temporary task
      const tempTask: Task = {
        id: Date.now(), // Temporary ID
        title: newTask.title,
        description: newTask.description || "",
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: null,
      };

      queryClient.setQueryData<Task[]>(["tasks"], [tempTask, ...previousTasks]);

      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Toggle task mutation with optimistic update
  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: number) =>
      apiClient.toggleTask(taskId) as Promise<Task>,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      queryClient.setQueryData<Task[]>(
        ["tasks"],
        previousTasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: !task.completed, updated_at: new Date().toISOString() }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: (data, error, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete task mutation with optimistic update
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => apiClient.deleteTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      queryClient.setQueryData<Task[]>(
        ["tasks"],
        previousTasks.filter((task) => task.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Update task mutation with optimistic update
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: { title: string } }) =>
      apiClient.updateTask(taskId, data) as Promise<Task>,
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      queryClient.setQueryData<Task[]>(
        ["tasks"],
        previousTasks.map((task) =>
          task.id === taskId
            ? { ...task, title: data.title, updated_at: new Date().toISOString() }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: () => {
      setEditingTaskId(null);
      setEditTitle("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Handle edit task
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
  };

  const handleSaveEdit = (taskId: number) => {
    if (editTitle.trim()) {
      updateTaskMutation.mutate({ taskId, data: { title: editTitle.trim() } });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">
          Error loading tasks: {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-6">You have no tasks yet.</p>
        <TaskForm onTaskCreated={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <TaskForm onTaskCreated={() => refetch()} />

      {/* Task list */}
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTaskMutation.mutate(task.id)}
              disabled={toggleTaskMutation.isPending || editingTaskId === task.id}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            />

            {editingTaskId === task.id ? (
              // Edit mode
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveEdit(task.id);
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  disabled={updateTaskMutation.isPending}
                  className="flex-1 px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(task.id)}
                  disabled={updateTaskMutation.isPending || !editTitle.trim()}
                  className="px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updateTaskMutation.isPending}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              // View mode
              <>
                <span
                  className={`flex-1 ${
                    task.completed ? "line-through text-gray-400" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => handleStartEdit(task)}
                  disabled={task.completed}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={task.completed ? "Cannot edit completed task" : "Edit task"}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  disabled={deleteTaskMutation.isPending}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Mutation pending indicator */}
      {(createTaskMutation.isPending ||
        toggleTaskMutation.isPending ||
        deleteTaskMutation.isPending ||
        updateTaskMutation.isPending) && (
        <p className="mt-4 text-sm text-gray-500 text-center">Syncing...</p>
      )}
    </div>
  );
}
