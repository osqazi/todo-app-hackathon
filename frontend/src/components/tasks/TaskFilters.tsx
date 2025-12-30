"use client";

import { useState } from "react";

export interface FilterCriteria {
  completed?: boolean | null;
  priority?: string[];
  tags?: string[];
  is_overdue?: boolean | null;
}

interface TaskFiltersProps {
  filters: FilterCriteria;
  onChange: (filters: FilterCriteria) => void;
  availableTags?: string[];
}

/**
 * Task filters component with checkboxes for status, priority, tags, and overdue
 */
export default function TaskFilters({
  filters,
  onChange,
  availableTags = [],
}: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCompletedChange = (value: boolean | null) => {
    onChange({ ...filters, completed: value });
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter((p) => p !== priority);
    onChange({ ...filters, priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked
      ? [...currentTags, tag]
      : currentTags.filter((t) => t !== tag);
    onChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleOverdueChange = (value: boolean | null) => {
    onChange({ ...filters, is_overdue: value });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.completed !== null && filters.completed !== undefined) count++;
    if (filters.priority && filters.priority.length > 0) count += filters.priority.length;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    if (filters.is_overdue !== null && filters.is_overdue !== undefined) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={filters.completed === null || filters.completed === undefined}
                  onChange={() => handleCompletedChange(null)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={filters.completed === false}
                  onChange={() => handleCompletedChange(false)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Pending</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={filters.completed === true}
                  onChange={() => handleCompletedChange(true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Completed</span>
              </label>
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
            <div className="space-y-2">
              {["high", "medium", "low"].map((priority) => (
                <label key={priority} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(priority) || false}
                    onChange={(e) => handlePriorityChange(priority, e.target.checked)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Overdue Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={filters.is_overdue === null || filters.is_overdue === undefined}
                  onChange={() => handleOverdueChange(null)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={filters.is_overdue === true}
                  onChange={() => handleOverdueChange(true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Overdue only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={filters.is_overdue === false}
                  onChange={() => handleOverdueChange(false)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Not overdue</span>
              </label>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <label key={tag} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.tags?.includes(tag) || false}
                      onChange={(e) => handleTagChange(tag, e.target.checked)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          {activeCount > 0 && (
            <button
              onClick={() =>
                onChange({
                  completed: null,
                  priority: undefined,
                  tags: undefined,
                  is_overdue: null,
                })
              }
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
