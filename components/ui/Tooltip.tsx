import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 tracking-wider uppercase rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-40 whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
