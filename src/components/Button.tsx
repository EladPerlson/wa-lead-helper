import { cn } from '@/utils/id';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-notion-accent text-white hover:bg-notion-accentHover shadow-notion',
  secondary: 'bg-notion-surface text-notion-text border border-notion-border hover:bg-notion-border/50',
  ghost: 'bg-transparent text-notion-muted hover:bg-notion-surface hover:text-notion-text',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-notion-accent/40',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      dir="rtl"
      {...props}
    >
      {children}
    </button>
  );
}
