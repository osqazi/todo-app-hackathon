/**
 * Dashboard page - task list and management.
 */

import { TaskList } from "@/components/tasks/TaskList";

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Tasks</h2>
      <TaskList />
    </div>
  );
}
