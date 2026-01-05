import * as React from 'react';
import { cn } from '@/lib/utils';

const VibrantCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden',
      'before:absolute before:top-0 before:left-0 before:right-0 before:h-1',
      'before:bg-gradient-to-r before:from-indigo-500 before:to-purple-600 before:opacity-30',
      className
    )}
    {...props}
  />
));
VibrantCard.displayName = 'VibrantCard';

const VibrantCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
VibrantCardHeader.displayName = 'VibrantCardHeader';

const VibrantCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100',
      className
    )}
    {...props}
  />
));
VibrantCardTitle.displayName = 'VibrantCardTitle';

const VibrantCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
VibrantCardDescription.displayName = 'VibrantCardDescription';

const VibrantCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
VibrantCardContent.displayName = 'VibrantCardContent';

const VibrantCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
VibrantCardFooter.displayName = 'VibrantCardFooter';

export {
  VibrantCard,
  VibrantCardHeader,
  VibrantCardFooter,
  VibrantCardTitle,
  VibrantCardDescription,
  VibrantCardContent,
};