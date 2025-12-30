"use client";

/**
 * Enhanced Dashboard page with search, filter, and sort functionality
 */

import { useState } from "react";
import { TaskList } from "@/components/tasks/TaskList";
import SearchBar from "@/components/tasks/SearchBar";
import TaskFilters, { FilterCriteria } from "@/components/tasks/TaskFilters";
import SortSelector, { SortOptions } from "@/components/tasks/SortSelector";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterCriteria>({
    completed: null,
    priority: undefined,
    tags: undefined,
    is_overdue: null,
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Mock available tags - in a real app, this would come from an API
  const availableTags = ["work", "personal", "urgent", "shopping"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Tasks</h2>

      {/* Search and Sort Row */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex-shrink-0">
          <SortSelector value={sortOptions} onChange={setSortOptions} />
        </div>
      </div>

      {/* Filters */}
      <div>
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          availableTags={availableTags}
        />
      </div>

      {/* Task Count Display */}
      <div className="text-sm text-gray-600">
        <span>Showing tasks</span>
        {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
        {filters.completed !== null && filters.completed !== undefined && (
          <span> - {filters.completed ? "Completed" : "Pending"}</span>
        )}
        {filters.priority && filters.priority.length > 0 && (
          <span> - Priority: {filters.priority.join(", ")}</span>
        )}
        {filters.tags && filters.tags.length > 0 && (
          <span> - Tags: {filters.tags.join(", ")}</span>
        )}
        {filters.is_overdue !== null && filters.is_overdue !== undefined && (
          <span> - {filters.is_overdue ? "Overdue" : "Not overdue"}</span>
        )}
      </div>

      {/* Task List */}
      <TaskList
        searchQuery={searchQuery}
        filters={filters}
        sortOptions={sortOptions}
      />
    </div>
  );
}
