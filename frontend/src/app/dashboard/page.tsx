"use client";

/**
 * Enhanced Dashboard page with vibrant dark theme, search, filter, sort, notification polling, and URL state persistence (US5)
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TaskList } from "@/components/tasks/TaskList";
import SearchBar from "@/components/tasks/SearchBar";
import TaskFilters, { FilterCriteria } from "@/components/tasks/TaskFilters";
import SortSelector, { SortOptions } from "@/components/tasks/SortSelector";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";
import { apiClient } from "@/lib/api";
import { VibrantMetricCard } from "@/components/ui/vibrant/VibrantMetricCard";
import { VibrantButton } from "@/components/ui/vibrant/VibrantButton";
import { Calendar, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';

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

  // Fetch tasks to calculate metrics
  const { data: response, isLoading } = useQuery({
    queryKey: ["tasks", { search: searchQuery, ...filters, ...sortOptions }],
    queryFn: () => apiClient.getTasksFiltered({
      offset: 0,
      limit: 100,
      search: searchQuery || undefined,
      completed: filters.completed !== null && filters.completed !== undefined ? filters.completed : null,
      priority: filters.priority,
      tags: filters.tags,
      is_overdue: filters.is_overdue !== null && filters.is_overdue !== undefined ? filters.is_overdue : null,
      sort_by: sortOptions.sort_by,
      sort_order: sortOptions.sort_order,
    }) as Promise<{ tasks: any[]; total: number }>,
    staleTime: 30000, // 30 seconds
  });

  const tasks = response?.tasks || [];
  const totalTasks = response?.total || 0;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const overdueTasksCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed).length;

  // Notification polling for due dates
  const { permission, permissionDenied, requestPermission, pendingTasks: notificationPendingTasks, lastCheck } =
    useNotificationPolling();

  // Track client-side mount to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch unique tags from API
  const { data: availableTags = [] } = useQuery({
    queryKey: ["tags", "unique"],
    queryFn: () => apiClient.getUniqueTags(),
  });

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
    <div className="space-y-6 animate-fade-in">
      {/* Header with Add Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            My Tasks
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your productivity and stay on track</p>
        </div>
        <Link href="/dashboard/new">
          <VibrantButton className="px-6 py-3 text-base font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Add New Task
          </VibrantButton>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <VibrantMetricCard
          title="Total Tasks"
          value={totalTasks}
          icon={<Calendar className="w-6 h-6" />}
          description="All your tasks"
          variant="total-tasks"
        />
        <VibrantMetricCard
          title="Pending"
          value={pendingTasksCount}
          icon={<Clock className="w-6 h-6" />}
          description="Tasks to complete"
          variant="pending-tasks"
        />
        <VibrantMetricCard
          title="Completed"
          value={completedTasksCount}
          icon={<CheckCircle className="w-6 h-6" />}
          description="Tasks finished"
          variant="completed-tasks"
        />
        <VibrantMetricCard
          title="Overdue"
          value={overdueTasksCount}
          icon={<AlertTriangle className="w-6 h-6" />}
          description="Urgent tasks"
          variant="overdue-tasks"
        />
      </div>

      {/* Active Filters Indicator (US5 - T074) */}
      {activeFilterCount > 0 && (
        <div className="vibrant-card p-4 vibrant-fade-in border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active
                </p>
                {searchQuery && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Search: <span className="font-medium">&ldquo;{searchQuery}&rdquo;</span>
                  </p>
                )}
              </div>
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
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-gradient-to-r from-slate-600/30 to-slate-700/30 hover:from-slate-500/40 hover:to-slate-600/40 px-4 py-2 rounded-lg transition-all duration-200 border border-slate-600/30"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Notification Banners - Only render after mount to prevent hydration errors */}
      {isMounted && (
        <>
          {/* Notification Permission Banner */}
          {permission === "default" && (
            <div className="vibrant-card p-4 animate-fade-in border border-blue-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Enable Task Reminders</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Get notified when your tasks are due. Click &quot;Enable&quot; to allow browser notifications.
                  </p>
                  <VibrantButton onClick={requestPermission} variant="outline">
                    Enable Notifications
                  </VibrantButton>
                </div>
              </div>
            </div>
          )}

          {/* Permission Denied Banner */}
          {permissionDenied && (
            <div className="vibrant-card p-4 animate-fade-in border border-yellow-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Notifications Blocked</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Task reminders are disabled. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Due Tasks Indicator */}
          {permission === "granted" && notificationPendingTasks.length > 0 && (
            <div className="vibrant-card p-4 animate-fade-in border border-orange-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {notificationPendingTasks.length} task{notificationPendingTasks.length > 1 ? "s" : ""} due soon
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    You have tasks due within the next 5 minutes
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Search and Sort Row */}
      <div className="flex flex-col lg:flex-row gap-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-700 dark:text-slate-300 vibrant-card p-4 animate-fade-in border border-slate-700/50">
        <div className="mb-2 sm:mb-0">
          Showing tasks
          {searchQuery && <span> matching <span className="font-semibold text-slate-800 dark:text-slate-200">&ldquo;{searchQuery}&rdquo;</span></span>}
          {filters.completed !== null && filters.completed !== undefined && (
            <span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{filters.completed ? "Completed" : "Pending"}</span></span>
          )}
          {filters.priority && filters.priority.length > 0 && (
            <span> - Priority: <span className="font-semibold text-slate-800 dark:text-slate-200">{filters.priority.join(", ")}</span></span>
          )}
          {filters.tags && filters.tags.length > 0 && (
            <span> - Tags: <span className="font-semibold text-slate-800 dark:text-slate-200">{filters.tags.join(", ")}</span></span>
          )}
          {filters.is_overdue !== null && filters.is_overdue !== undefined && (
            <span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{filters.is_overdue ? "Overdue" : "Not overdue"}</span></span>
          )}
        </div>
        {lastCheck && (
          <div className="text-xs text-slate-700 dark:text-slate-300">
            Last check: {lastCheck.toLocaleTimeString()}
          </div>
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
