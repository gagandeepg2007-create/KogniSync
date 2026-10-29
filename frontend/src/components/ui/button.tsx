import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-98';
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
      outline: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
      accent: 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
