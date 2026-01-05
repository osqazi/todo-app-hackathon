import * as React from 'react';
import { cn } from '@/lib/utils';

export interface VibrantMetricCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'total-tasks' | 'pending-tasks' | 'completed-tasks' | 'overdue-tasks' | 'default';
  loading?: boolean;
}

const VibrantMetricCard = React.forwardRef<HTMLDivElement, VibrantMetricCardProps>(
  ({ className, title, value, description, icon, variant = 'default', loading = false, ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'total-tasks':
          return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800';
        case 'pending-tasks':
          return 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-800';
        case 'completed-tasks':
          return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800';
        case 'overdue-tasks':
          return 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-200 dark:border-red-800';
        default:
          return 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-purple-800';
      }
    };

    const getTopBarClass = () => {
      switch (variant) {
        case 'total-tasks':
          return 'bg-gradient-to-r from-blue-500 to-cyan-600';
        case 'pending-tasks':
          return 'bg-gradient-to-r from-yellow-500 to-amber-600';
        case 'completed-tasks':
          return 'bg-gradient-to-r from-green-500 to-emerald-600';
        case 'overdue-tasks':
          return 'bg-gradient-to-r from-red-500 to-rose-600';
        default:
          return 'bg-gradient-to-r from-indigo-500 to-purple-600';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden',
          getVariantClass(),
          className
        )}
        {...props}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {title}
              </p>
              {loading ? (
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {value}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className={`${getTopBarClass()} p-3 rounded-lg shadow-sm`}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          </div>
        </div>
        <div
          className={`absolute top-0 left-0 w-full h-1 ${getTopBarClass()}`}
        />
      </div>
    );
  }
);
VibrantMetricCard.displayName = 'VibrantMetricCard';

export { VibrantMetricCard };