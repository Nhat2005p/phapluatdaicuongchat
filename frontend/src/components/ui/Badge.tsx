import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-sky-500/20 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20',
        secondary:
          'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700',
        destructive:
          'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20',
        outline:
          'border-slate-700 text-slate-400',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
        purple:
          'border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
