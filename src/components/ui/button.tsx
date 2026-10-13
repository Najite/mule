import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'signal';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 btn-press';

    const variants = {
      default:
        'bg-signal text-canvas font-semibold hover:bg-signal-hover shadow-sm shadow-signal/20',
      signal:
        'bg-signal text-canvas font-semibold hover:bg-signal-hover shadow-sm shadow-signal/20',
      secondary:
        'bg-canvas-raised text-text-primary hover:bg-canvas-overlay border border-border-subtle hover:border-border-medium',
      outline:
        'border border-border-subtle bg-transparent text-text-primary hover:bg-canvas-raised hover:border-border-medium',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-canvas-raised',
      destructive:
        'bg-risk text-white hover:bg-risk-hover border border-risk/40',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm gap-2',
      sm: 'h-8 rounded-md px-3 text-xs gap-1.5',
      lg: 'h-12 rounded-xl px-6 text-base gap-2.5',
      icon: 'size-10 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
