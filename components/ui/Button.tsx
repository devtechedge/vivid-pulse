import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        suppressHydrationWarning
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          {
            // Neo-Noir Cyberpunk Minimalist Variants
            'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-violet-500/30 rounded':
              variant === 'primary',
            'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded':
              variant === 'secondary',
            'bg-transparent hover:bg-slate-800/50 text-slate-200 border border-slate-700 hover:border-slate-500 rounded':
              variant === 'outline',
            'bg-transparent hover:bg-violet-500/10 text-violet-400 hover:text-violet-300 rounded':
              variant === 'ghost',
            'bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 rounded':
              variant === 'danger',
          },
          {
            'px-3 py-1.5 text-xs font-semibold': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3.5 text-base': size === 'lg',
            'p-2': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
