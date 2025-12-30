"use client";

/**
 * Enhanced Dashboard page with search, filter, sort, notification polling, and URL state persistence (US5)
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TaskList } from "@/components/tasks/TaskList";
import SearchBar from "@/components/tasks/SearchBar";
import TaskFilters, { FilterCriteria } from "@/components/tasks/TaskFilters";
import SortSelector, { SortOptions } from "@/components/tasks/SortSelector";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  // Notification polling for due dates
  const { permission, permissionDenied, requestPermission, pendingTasks, lastCheck } =
    useNotificationPolling();

  // Track client-side mount to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mock available tags - in a real app, this would come from an API
  const availableTags = ["work", "personal", "urgent", "shopping"];

  // Load state from URL on mount (US5 - T071)
  useEffect(() => {
    if (!searchParams || isInitialized) return;

    const search = searchParams.get("search") || "";
    const completedParam = searchParams.get("completed");
    const priorityParam = searchParams.getAll("priority");
    const tagsParam = searchParams.getAll("tags");
    const isOverdueParam = searchParams.get("is_overdue");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    setSearchQuery(search);
    setFilters({
      completed: completedParam === "true" ? true : completedParam === "false" ? false : null,
      priority: priorityParam.length > 0 ? priorityParam : undefined,
      tags: tagsParam.length > 0 ? tagsParam : undefined,
      is_overdue: isOverdueParam === "true" ? true : isOverdueParam === "false" ? false : null,
    });
    setSortOptions({
      sort_by: sortBy as any,
      sort_order: sortOrder as any,
    });

    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Update URL when state changes (US5 - T070, T072)
  const updateURL = useCallback(() => {
    if (!isInitialized) return; // Don't update URL during initial load

    const params = new URLSearchParams();

    // Add search
    if (searchQuery) {
      params.set("search", searchQuery);
    }

    // Add filters
    if (filters.completed !== null && filters.completed !== undefined) {
      params.set("completed", filters.completed.toString());
    }
    if (filters.priority && filters.priority.length > 0) {
      filters.priority.forEach((p) => params.append("priority", p));
    }
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((t) => params.append("tags", t));
    }
    if (filters.is_overdue !== null && filters.is_overdue !== undefined) {
      params.set("is_overdue", filters.is_overdue.toString());
    }

    // Add sort
    params.set("sort_by", sortOptions.sort_by);
    params.set("sort_order", sortOptions.sort_order);

    // Update URL without navigation (preserves history)
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [isInitialized, searchQuery, filters, sortOptions, router]);

  // Trigger URL update when state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Count active filters for visual feedback (US5 - T074)
  const activeFilterCount = [
    filters.completed !== null && filters.completed !== undefined ? 1 : 0,
    filters.priority && filters.priority.length > 0 ? 1 : 0,
    filters.tags && filters.tags.length > 0 ? 1 : 0,
    filters.is_overdue !== null && filters.is_overdue !== undefined ? 1 : 0,
    searchQuery ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header with Add Task Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Tasks</h2>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Task
        </Link>
      </div>

      {/* Active Filters Indicator (US5 - T074) */}
      {activeFilterCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active
              </span>
              {searchQuery && (
                <span className="text-xs text-blue-700 ml-1">
                  (search: &ldquo;{searchQuery}&rdquo;)
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilters({
                  completed: null,
                  priority: undefined,
                  tags: undefined,
                  is_overdue: null,
                });
              }}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium underline"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Notification Banners - Only render after mount to prevent hydration errors */}
      {isMounted && (
        <>
          {/* Notification Permission Banner */}
          {permission === "default" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">Enable Task Reminders</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Get notified when your tasks are due. Click &quot;Enable&quot; to allow browser notifications.
                  </p>
                </div>
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                >
                  Enable
                </button>
              </div>
            </div>
          )}

          {/* Permission Denied Banner */}
          {permissionDenied && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-900">Notifications Blocked</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Task reminders are disabled. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Due Tasks Indicator */}
          {permission === "granted" && pendingTasks.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-900">
                    {pendingTasks.length} task{pendingTasks.length > 1 ? "s" : ""} due soon
                  </h3>
                  <p className="mt-1 text-sm text-orange-700">
                    You have tasks due within the next 5 minutes
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
        {lastCheck && (
          <span className="text-gray-400"> • Last notification check: {lastCheck.toLocaleTimeString()}</span>
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
