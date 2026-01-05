import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
  variant?: 'total-tasks' | 'pending-tasks' | 'completed-tasks' | 'overdue-tasks';
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  className = '',
  variant = 'total-tasks'
}: MetricCardProps) {
  return (
    <div className={`metric-card ${variant} ${className} animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className="p-3 bg-white/80 dark:bg-gray-700/80 rounded-full shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}