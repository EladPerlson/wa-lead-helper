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
        <label htmlFor={textareaId} className="text-sm font-medium text-notion-text text-right">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3 py-2.5 text-sm text-right rounded-xl resize-none min-h-[120px]',
          'bg-notion-bg border border-notion-border text-notion-text',
          'placeholder:text-notion-muted',
          'focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent',
          'transition-all duration-200 leading-relaxed',
          className,
        )}
        dir="rtl"
        {...props}
      />
    </div>
  );
}
