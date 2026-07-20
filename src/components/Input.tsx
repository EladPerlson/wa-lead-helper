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
        <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-notion-muted text-right">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'wa-lh-field w-full px-3.5 py-2.5 text-sm text-right rounded-[14px]',
          'border border-notion-border',
          'focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent',
          'transition-all duration-200',
          className,
        )}
        style={{
          backgroundColor: 'var(--notion-surface-2)',
          color: 'var(--notion-text)',
          WebkitTextFillColor: 'var(--notion-text)',
        }}
        dir="rtl"
        {...props}
      />
    </div>
  );
}
