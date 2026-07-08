import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-bold tracking-wide transition-all rounded-lg cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-[11px] uppercase tracking-wider",
    md: "px-4 py-2.5 text-xs uppercase tracking-wider",
    lg: "px-6 py-3.5 text-sm uppercase tracking-wider"
  };

  const variantStyles = {
    primary: "bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md border border-amber-500/40",
    secondary: "bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800",
    outline: "bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-slate-100",
    danger: "bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/50"
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
