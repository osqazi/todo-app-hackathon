/**
 * PrioritySelector component - dropdown for selecting task priority.
 *
 * Allows users to select high, medium, or low priority for tasks.
 * Displays color-coded indicators matching the priority level.
 */

"use client";

import { useState, useEffect } from "react";

export type Priority = "high" | "medium" | "low";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "High Priority", color: "text-red-600" },
  { value: "medium", label: "Medium Priority", color: "text-yellow-600" },
  { value: "low", label: "Low Priority", color: "text-green-600" },
];

export function PrioritySelector({
  value,
  onChange,
  disabled = false,
}: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = priorityOptions.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".priority-selector")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (priority: Priority) => {
    onChange(priority);
    setIsOpen(false);
  };

  return (
    <div className="priority-selector relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Priority
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
      >
        <span className={`flex items-center gap-2 ${selectedOption?.color} text-gray-900 dark:text-white`}>
          <span className="priority-indicator">●</span>
          <span>{selectedOption?.label || "Select Priority"}</span>
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${option.color} text-gray-900 dark:text-white`}
            >
              <span className="flex items-center gap-2">
                <span className="priority-indicator">●</span>
                <span>{option.label}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
