/**
 * Enhanced Task Form component with due date support.
 *
 * Input for task title, priority, tags, and due date with validation.
 */

"use client";

import { useState } from "react";
import { PrioritySelector, Priority } from "./PrioritySelector";
import { TagInput } from "./TagInput";
import DateTimePicker from "./DateTimePicker";
import RecurrenceConfig, { RecurrenceSettings } from "./RecurrenceConfig";

interface TaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: Priority;
    tags?: string[];
    due_date?: Date | null;
    is_recurring?: boolean;
    recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
    recurrence_end_date?: Date | null;
  }) => void;
  isSubmitting?: boolean;
}

export function TaskForm({ onSubmit, isSubmitting = false }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceSettings>({
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null,
  });
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

    // Validate recurrence: pattern required if recurring enabled
    if (recurrence.is_recurring && !recurrence.recurrence_pattern) {
      setError("Please select a recurrence pattern (daily, weekly, or monthly)");
      return;
    }

    // Validate recurrence: due_date required if recurring enabled
    if (recurrence.is_recurring && !dueDate) {
      setError("Due date is required for recurring tasks");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        tags: tags.length > 0 ? tags : undefined,
        due_date: dueDate,
        is_recurring: recurrence.is_recurring,
        recurrence_pattern: recurrence.recurrence_pattern,
        recurrence_end_date: recurrence.recurrence_end_date,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTags([]);
      setDueDate(null);
      setRecurrence({
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>

      {/* Title input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
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

      {/* Description input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          disabled={loading}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Priority and Due Date row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrioritySelector
          value={priority}
          onChange={setPriority}
          disabled={loading}
        />
        <DateTimePicker
          selected={dueDate}
          onChange={setDueDate}
          label="Due Date (optional)"
          minDate={new Date()}
          placeholderText="Select due date and time"
        />
      </div>

      {/* Tags */}
      <div>
        <TagInput
          tags={tags}
          onChange={setTags}
          disabled={loading}
        />
      </div>

      {/* Recurrence Configuration (US4 - T065) */}
      <div>
        <RecurrenceConfig
          value={recurrence}
          onChange={setRecurrence}
          disabled={loading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || isSubmitting || !title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {(loading || isSubmitting) ? "Adding..." : "Add Task"}
        </button>
      </div>
    </form>
  );
}
