/**
 * API client for backend communication.
 *
 * Automatically includes JWT token in Authorization header
 * and handles 401 responses by redirecting to sign-in.
 */

import { getToken } from "./auth/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, headers, ...fetchOptions } = options;

    // Get JWT token if authentication is required
    let authHeaders: Record<string, string> = {};
    if (requiresAuth) {
      const token = await getToken();
      if (!token) {
        // Redirect to sign-in if no token
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        throw new Error("Authentication required");
      }

      // DEBUG: Decode JWT token to see its contents
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("DEBUG api.ts: JWT token payload =", payload);
        console.log("DEBUG api.ts: JWT audience (aud) =", payload.aud);
      } catch (e) {
        console.error("DEBUG api.ts: Failed to decode JWT", e);
      }

      authHeaders = { Authorization: `Bearer ${token}` };
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
    });

    // Handle 401 - redirect to sign-in
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
      throw new Error("Session expired. Please sign in again.");
    }

    // Handle errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = typeof error.detail === 'string'
        ? error.detail
        : (typeof error.detail === 'object' && error.detail !== null)
          ? JSON.stringify(error.detail)
          : `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Task endpoints
  async getTasks(offset = 0, limit = 100) {
    return this.request(`/api/tasks?offset=${offset}&limit=${limit}`);
  }

  async getTasksFiltered(params: {
    offset?: number;
    limit?: number;
    search?: string;
    completed?: boolean | null;
    priority?: string[];
    tags?: string[];
    due_date_from?: string;
    due_date_to?: string;
    is_overdue?: boolean | null;
    sort_by?: string;
    sort_order?: string;
  }) {
    const queryParams = new URLSearchParams();

    // Pagination
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());

    // Search
    if (params.search) queryParams.append("search", params.search);

    // Filters
    if (params.completed !== null && params.completed !== undefined) {
      queryParams.append("completed", params.completed.toString());
    }
    if (params.priority && params.priority.length > 0) {
      params.priority.forEach(p => queryParams.append("priority", p));
    }
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(t => queryParams.append("tags", t));
    }
    if (params.due_date_from) queryParams.append("due_date_from", params.due_date_from);
    if (params.due_date_to) queryParams.append("due_date_to", params.due_date_to);
    if (params.is_overdue !== null && params.is_overdue !== undefined) {
      queryParams.append("is_overdue", params.is_overdue.toString());
    }

    // Sort
    if (params.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params.sort_order) queryParams.append("sort_order", params.sort_order);

    return this.request(`/api/tasks?${queryParams.toString()}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    priority?: "high" | "medium" | "low";
    tags?: string[];
    due_date?: string | null;
    is_recurring?: boolean;
    recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
    recurrence_end_date?: string | null;
  }) {
    return this.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTask(taskId: number) {
    return this.request(`/api/tasks/${taskId}`);
  }

  async updateTask(
    taskId: number,
    data: {
      title?: string;
      description?: string;
      priority?: "high" | "medium" | "low";
      due_date?: string | null;
      tags?: string[];
      is_recurring?: boolean;
      recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
      recurrence_end_date?: string | null;
    }
  ) {
    return this.request(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: number) {
    return this.request(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  async toggleTask(taskId: number) {
    return this.request(`/api/tasks/${taskId}/toggle`, {
      method: "POST",
    });
  }

  // Complete endpoint (US4 - T067)
  async completeTask(taskId: number) {
    return this.request<{
      completed_task: any;
      next_instance: any | null;
    }>(`/api/tasks/${taskId}/complete`, {
      method: "POST",
    });
  }

  // Notification endpoints (US3)
  async getDueTasks() {
    return this.request("/api/tasks/due");
  }

  async markNotificationSent(taskId: number) {
    return this.request(`/api/tasks/${taskId}/notification-sent`, {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient(API_URL);
