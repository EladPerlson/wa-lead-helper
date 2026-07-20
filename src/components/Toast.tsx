import type { ToastMessage } from '@/types';
import { cn } from '@/utils/id';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const typeStyles = {
  success:
    'border-notion-success/40 text-notion-success bg-notion-success/10',
  error: 'border-notion-danger/40 text-notion-danger bg-notion-danger/10',
  info: 'border-notion-accent/40 text-notion-accent bg-notion-soft',
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-[10001] flex flex-col gap-2 pointer-events-none" dir="rtl">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto px-4 py-2.5 rounded-2xl border text-sm font-medium',
            'wa-lh-glass shadow-notion-lg animate-rise',
            'flex items-center gap-2 min-w-[200px]',
            typeStyles[toast.type],
          )}
          dir="rtl"
        >
          <span className="flex-1 text-right">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="opacity-60 hover:opacity-100 text-xs"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
