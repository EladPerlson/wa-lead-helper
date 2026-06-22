import type { ToastMessage } from '@/types';
import { cn } from '@/utils/id';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const typeStyles = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200',
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[10001] flex flex-col gap-2" dir="rtl">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'px-4 py-2.5 rounded-xl border text-sm font-medium shadow-notion-lg animate-slide-in',
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
