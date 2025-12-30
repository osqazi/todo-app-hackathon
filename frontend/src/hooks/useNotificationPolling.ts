"use client";

import { useEffect, useState, useRef } from "react";
import { apiClient } from "@/lib/api";

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
}

interface NotificationState {
  permission: NotificationPermission;
  permissionDenied: boolean;
  lastCheck: Date | null;
  pendingTasks: Task[];
}

/**
 * Custom hook for polling due tasks and showing browser notifications
 *
 * Polls every 60 seconds for tasks due within the next 5 minutes
 * Requests notification permission on first use
 * Shows browser notifications and marks them as sent
 */
export function useNotificationPolling() {
  const [state, setState] = useState<NotificationState>({
    permission: typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
    permissionDenied: false,
    lastCheck: null,
    pendingTasks: [],
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedTaskIds = useRef<Set<number>>(new Set());

  // Request notification permission
  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Browser notifications not supported");
      setState(prev => ({ ...prev, permissionDenied: true }));
      return;
    }

    if (Notification.permission === "granted") {
      setState(prev => ({ ...prev, permission: "granted" }));
      return;
    }

    if (Notification.permission === "denied") {
      setState(prev => ({ ...prev, permission: "denied", permissionDenied: true }));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({
        ...prev,
        permission,
        permissionDenied: permission === "denied",
      }));
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setState(prev => ({ ...prev, permissionDenied: true }));
    }
  };

  // Check for due tasks and show notifications
  const checkDueTasks = async () => {
    try {
      const tasks = await apiClient.getDueTasks() as Task[];
      console.log("DEBUG: Successfully fetched due tasks:", tasks);
      setState(prev => ({ ...prev, pendingTasks: tasks, lastCheck: new Date() }));

      // If permission is granted, show notifications
      if (state.permission === "granted" && tasks.length > 0) {
        for (const task of tasks) {
          // Skip if already notified in this session
          if (notifiedTaskIds.current.has(task.id)) {
            continue;
          }

          // Show notification
          const notification = new Notification("Task Due Soon!", {
            body: `${task.title}\n\nDue: ${new Date(task.due_date).toLocaleString()}`,
            icon: "/favicon.ico",
            tag: `task-${task.id}`,
            requireInteraction: false,
          });

          // Mark as notified
          notifiedTaskIds.current.add(task.id);

          // Call backend to mark notification as sent
          try {
            await apiClient.markNotificationSent(task.id);
          } catch (error) {
            console.error(`Failed to mark notification sent for task ${task.id}:`, error);
          }

          // Auto-close notification after 10 seconds
          setTimeout(() => {
            notification.close();
          }, 10000);
        }
      }
    } catch (error) {
      console.error("Error checking due tasks:", error);
      // Silently handle errors - notifications are optional feature
      // Set empty tasks list to avoid showing stale data
      setState(prev => ({ ...prev, pendingTasks: [], lastCheck: new Date() }));
    }
  };

  // Sync permission state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setState(prev => ({
        ...prev,
        permission: Notification.permission,
        permissionDenied: Notification.permission === "denied",
      }));
    }
  }, []);

  // Setup polling
  useEffect(() => {
    // Don't run on server
    if (typeof window === "undefined") return;

    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return;
    }

    // Initial check
    checkDueTasks();

    // Setup 60-second polling
    intervalRef.current = setInterval(() => {
      checkDueTasks();
    }, 60000); // 60 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.permission]); // Re-run when permission changes

  return {
    ...state,
    requestPermission,
    checkNow: checkDueTasks,
  };
}
