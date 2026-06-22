import { cn } from '@/utils/id';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id ?? label;

  return (
    <div className="flex flex-col gap-1.5" dir="rtl">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-notion-text text-right">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-sm text-right rounded-xl',
          'bg-notion-bg border border-notion-border text-notion-text',
          'placeholder:text-notion-muted',
          'focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent',
          'transition-all duration-200',
          className,
        )}
        dir="rtl"
        {...props}
      />
    </div>
  );
}
