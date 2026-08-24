import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          suppressHydrationWarning
          className={cn(
            'w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 px-4 py-2.5 text-sm transition-all duration-200 outline-none rounded focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/40 focus:bg-slate-900/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]',
            error && 'border-rose-500/80 focus:border-rose-500/80 focus:ring-rose-500/40',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 font-medium mt-0.5">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
