import * as React from 'react';
import { cn } from '@/lib/utils';

export interface VibrantInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'success' | 'error';
}

const VibrantInput = React.forwardRef<HTMLInputElement, VibrantInputProps>(
  ({ className, type, label, error, helperText, variant = 'default', ...props }, ref) => {
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
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border-2 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50',
            getBorderClass(),
            className
          )}
          ref={ref}
          {...props}
        />
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
VibrantInput.displayName = 'VibrantInput';

export { VibrantInput };