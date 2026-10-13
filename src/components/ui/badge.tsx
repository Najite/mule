import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'risk' | 'verified' | 'signal';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default:
      'border-transparent bg-signal/15 text-signal border border-signal/30',
    signal:
      'border-signal/30 bg-signal/10 text-signal',
    secondary:
      'border-border-subtle bg-canvas-raised text-text-secondary',
    outline:
      'border-border-subtle text-text-secondary',
    risk:
      'border-risk/30 bg-risk/10 text-risk',
    verified:
      'border-verified/30 bg-verified/10 text-verified',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
