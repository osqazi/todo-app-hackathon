/**
 * Task Form component - creates new tasks.
 *
 * Input for task title, priority, and tags with validation and submission handler.
 * Used in the dashboard for adding new tasks.
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { PrioritySelector, Priority } from "./PrioritySelector";
import { TagInput } from "./TagInput";

interface TaskFormProps {
  onTaskCreated?: () => void;
}

export function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tags, setTags] = useState<string[]>([]);
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
      await apiClient.createTask({
        title: title.trim(),
        priority,
        tags,
      });
      setTitle("");
      setPriority("medium");
      setTags([]);
      onTaskCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      {/* Title input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Priority and Tags row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrioritySelector
          value={priority}
          onChange={setPriority}
          disabled={loading}
        />
        <TagInput
          tags={tags}
          onChange={setTags}
          disabled={loading}
        />
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
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
