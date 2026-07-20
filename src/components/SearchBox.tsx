import { cn } from '@/utils/id';
import type { InputHTMLAttributes } from 'react';

interface SearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function SearchBox({ label, className, ...props }: SearchBoxProps) {
  return (
    <div className="relative" dir="rtl">
      {label && (
        <label className="block text-xs font-semibold tracking-wide text-notion-muted mb-1.5 text-right">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-notion-accent text-sm pointer-events-none">
          ⌕
        </span>
        <input
          type="search"
          className={cn(
            'w-full pr-9 pl-3.5 py-2.5 text-sm text-right rounded-[14px]',
            'wa-lh-field border border-notion-border bg-notion-surface2',
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
    </div>
  );
}
