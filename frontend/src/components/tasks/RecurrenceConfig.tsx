"use client";

/**
 * RecurrenceConfig component for configuring recurring task settings (US4 - T064)
 *
 * Features:
 * - Enable/disable recurring checkbox
 * - Pattern selector (daily/weekly/monthly)
 * - Optional end date picker
 * - Validation: pattern required when recurring enabled
 */

import { useState, useEffect } from "react";

export interface RecurrenceSettings {
  is_recurring: boolean;
  recurrence_pattern: "daily" | "weekly" | "monthly" | null;
  recurrence_end_date: Date | null;
}

interface RecurrenceConfigProps {
  value: RecurrenceSettings;
  onChange: (settings: RecurrenceSettings) => void;
  disabled?: boolean;
}

export default function RecurrenceConfig({
  value,
  onChange,
  disabled = false,
}: RecurrenceConfigProps) {
  const [isRecurring, setIsRecurring] = useState(value.is_recurring);
  const [pattern, setPattern] = useState<"daily" | "weekly" | "monthly" | null>(
    value.recurrence_pattern
  );
  const [endDate, setEndDate] = useState<string>(
    value.recurrence_end_date
      ? value.recurrence_end_date.toISOString().split("T")[0]
      : ""
  );

  // Sync changes to parent
  useEffect(() => {
    onChange({
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? pattern : null,
      recurrence_end_date: endDate ? new Date(endDate) : null,
    });
  }, [isRecurring, pattern, endDate, onChange]);

  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurring(checked);
    if (!checked) {
      setPattern(null);
      setEndDate("");
    } else if (!pattern) {
      // Default to daily when enabling
      setPattern("daily");
    }
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Enable Recurring Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-recurring"
          checked={isRecurring}
          onChange={(e) => handleRecurringToggle(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label
          htmlFor="is-recurring"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          Recurring Task
        </label>
      </div>

      {/* Pattern Selector (shown when recurring enabled) */}
      {isRecurring && (
        <div className="space-y-2 pl-6 border-l-2 border-blue-200">
          <label className="block text-sm font-medium text-gray-700">
            Repeat Every
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="flex gap-3">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="recurrence-pattern"
                  value={p}
                  checked={pattern === p}
                  onChange={() => setPattern(p)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{p}</span>
              </label>
            ))}
          </div>

          {/* End Date Picker (optional) */}
          <div className="mt-3">
            <label
              htmlFor="recurrence-end-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                id="recurrence-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={disabled}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {endDate && (
                <button
                  type="button"
                  onClick={() => setEndDate("")}
                  disabled={disabled}
                  className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
                  title="Clear end date"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for recurring indefinitely
            </p>
          </div>

          {/* Preview Text */}
          {pattern && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Preview:</strong> This task will repeat{" "}
              <strong>{pattern}</strong>
              {endDate ? ` until ${new Date(endDate).toLocaleDateString()}` : " indefinitely"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
