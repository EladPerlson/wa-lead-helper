import { cn } from '@/utils/id';
import type { InputHTMLAttributes } from 'react';

interface SearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function SearchBox({ label, className, ...props }: SearchBoxProps) {
  return (
    <div className="relative" dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-notion-text mb-1.5 text-right">{label}</label>
      )}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-notion-muted text-sm">🔍</span>
        <input
          type="search"
          className={cn(
            'w-full pr-9 pl-3 py-2 text-sm text-right rounded-xl',
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
    </div>
  );
}
