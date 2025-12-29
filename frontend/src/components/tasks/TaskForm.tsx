/**
 * Task Form component - creates new tasks.
 *
 * Input for task title with validation and submission handler.
 * Used in the dashboard for adding new tasks.
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";

interface TaskFormProps {
  onTaskCreated?: () => void;
}

export function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await apiClient.createTask({ title: title.trim() });
      setTitle("");
      onTaskCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Adding..." : "Add Task"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
