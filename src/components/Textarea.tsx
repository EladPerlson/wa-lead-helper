import { cn } from '@/utils/id';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label;

  return (
    <div className="flex flex-col gap-1.5" dir="rtl">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold tracking-wide text-notion-muted text-right">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'wa-lh-field w-full px-4 py-3 text-sm text-right rounded-[14px] resize-none min-h-[140px]',
          'border border-notion-border',
          'focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent',
          'transition-all duration-200 leading-relaxed',
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
