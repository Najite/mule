import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-signal/30 bg-signal/15 text-signal',
        signal: 'border-signal/30 bg-signal/10 text-signal',
        secondary: 'border-border-subtle bg-canvas-raised text-text-secondary',
        outline: 'border-border-subtle text-text-secondary',
        risk: 'border-risk/30 bg-risk/10 text-risk',
        verified: 'border-verified/30 bg-verified/10 text-verified',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
