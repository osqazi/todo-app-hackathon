import * as React from 'react';
import { cn } from '@/lib/utils';

// Responsive container component
const ResponsiveContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      className
    )}
    {...props}
  />
));
ResponsiveContainer.displayName = 'ResponsiveContainer';

// Responsive grid component
const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      className
    )}
    {...props}
  />
));
ResponsiveGrid.displayName = 'ResponsiveGrid';

// Responsive card component
const ResponsiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden',
      'before:absolute before:top-0 before:left-0 before:right-0 before:h-1',
      'before:bg-gradient-to-r before:from-indigo-500 before:to-purple-600 before:opacity-30',
      'sm:p-4 md:p-6',
      className
    )}
    {...props}
  />
));
ResponsiveCard.displayName = 'ResponsiveCard';

// Responsive button component
const ResponsiveButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
      'px-4 py-2 sm:px-6 sm:py-3',
      className
    )}
    {...props}
  />
));
ResponsiveButton.displayName = 'ResponsiveButton';

export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveButton,
};