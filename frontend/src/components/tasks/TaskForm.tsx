/**
 * Enhanced Task Form component with vibrant dark theme and due date support.
 *
 * Input for task title, priority, tags, and due date with validation.
 */

"use client";

import { useState } from "react";
import { PrioritySelector, Priority } from "./PrioritySelector";
import { TagInput } from "./TagInput";
import DateTimePicker from "./DateTimePicker";
import RecurrenceConfig, { RecurrenceSettings } from "./RecurrenceConfig";
import { VibrantButton } from "@/components/ui/vibrant/VibrantButton";
import { VibrantCard, VibrantCardHeader, VibrantCardTitle, VibrantCardContent, VibrantCardDescription } from "@/components/ui/vibrant/VibrantCard";
import { VibrantInput } from "@/components/ui/vibrant/VibrantInput";

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
    <form onSubmit={handleSubmit} className="card-vibrant mb-6 animate-fade-in">
      <VibrantCardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <VibrantCardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Create New Task
            </VibrantCardTitle>
            <VibrantCardDescription className="text-slate-500 dark:text-slate-400">
              Add a new task to your productivity dashboard
            </VibrantCardDescription>
          </div>
        </div>
      </VibrantCardHeader>

      <VibrantCardContent className="space-y-6">
        {/* Title input */}
        <div>
          <VibrantInput
            type="text"
            label="Task Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Description input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            disabled={loading}
            rows={3}
            className="input-vibrant w-full border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-900 dark:text-white"
          />
        </div>

        {/* Priority and Due Date row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <PrioritySelector
              value={priority}
              onChange={setPriority}
              disabled={loading}
            />
          </div>
          <div>
            <DateTimePicker
              selected={dueDate}
              onChange={setDueDate}
              label="Due Date (optional)"
              minDate={new Date()}
              placeholderText="Select due date and time"
            />
          </div>
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
          <div className="notification notification-error rounded-lg p-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <VibrantButton
            type="submit"
            loading={loading || isSubmitting}
            disabled={!title.trim()}
            className="px-6 py-3 text-base font-semibold"
          >
            {loading || isSubmitting ? "Adding Task..." : "Add Task"}
          </VibrantButton>
        </div>
      </VibrantCardContent>
    </form>
  );
}
