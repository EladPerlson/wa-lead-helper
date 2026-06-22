import { cn } from '@/utils/id';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className, title }: CardProps) {
  return (
    <div
      className={cn(
        'bg-notion-bg border border-notion-border rounded-xl p-4 shadow-notion',
        'animate-fade-in',
        className,
      )}
      dir="rtl"
    >
      {title && <h3 className="text-sm font-semibold text-notion-text mb-3 text-right">{title}</h3>}
      {children}
    </div>
  );
}
