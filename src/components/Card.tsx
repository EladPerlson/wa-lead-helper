import { cn } from '@/utils/id';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  glass?: boolean;
}

export function Card({ children, className, title, glass = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] p-4 animate-fade-in',
        glass ? 'wa-lh-glass' : 'wa-lh-surface',
        className,
      )}
      dir="rtl"
    >
      {title && (
        <h3 className="text-sm font-semibold text-notion-text mb-3 text-right tracking-wide">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
