import * as React from 'react';
import { cn } from '@/lib/utils';

export interface VibrantSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  variant?: 'default' | 'success' | 'error';
}

const VibrantSelect = React.forwardRef<HTMLSelectElement, VibrantSelectProps>(
  ({ className, label, error, helperText, options, variant = 'default', ...props }, ref) => {
    const hasError = !!error;

    const getBorderClass = () => {
      if (hasError) return 'border-red-500 focus:border-red-500';
      if (variant === 'success') return 'border-green-500 focus:border-green-500';
      return 'border-slate-300 dark:border-slate-600 focus:border-indigo-500';
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex h-10 w-full rounded-lg border-2 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none',
            'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")] bg-[right_0.75rem_center] bg-no-repeat pl-4 pr-10',
            getBorderClass(),
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && !hasError && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
        {hasError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);
VibrantSelect.displayName = 'VibrantSelect';

export { VibrantSelect };