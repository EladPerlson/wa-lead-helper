import { cn } from '@/utils/id';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary:
    'wa-lh-accent-gradient text-brand-mist border border-transparent hover:brightness-110 shadow-[0_8px_20px_rgba(0,173,181,0.28)]',
  secondary:
    'bg-notion-surface text-notion-text border border-notion-border hover:border-notion-accent/50 hover:bg-notion-soft',
  outline:
    'bg-transparent text-notion-accent border border-notion-accent/45 hover:bg-notion-soft hover:border-notion-accent',
  ghost: 'bg-transparent text-notion-muted hover:bg-notion-soft hover:text-notion-text border border-transparent',
  danger: 'bg-notion-danger text-white hover:brightness-110 border border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-[14px]',
  lg: 'px-5 py-3 text-base rounded-[14px]',
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
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-200 active:scale-[0.98]',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-notion-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-notion-bg',
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
