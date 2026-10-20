import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/30',
        destructive:
          'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
        outline:
          'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white',
        secondary:
          'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700/80',
        ghost:
          'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
        link:
          'text-sky-400 underline-offset-4 hover:underline',
        emerald:
          'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500'
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm gap-2',
        sm: 'h-8 rounded-md px-3 text-xs gap-1.5',
        md: 'h-9 px-4 py-2 text-sm gap-2',
        lg: 'h-11 rounded-lg px-6 text-base gap-2.5',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
