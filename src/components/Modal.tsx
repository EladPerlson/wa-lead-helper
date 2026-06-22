import { Button } from './Button';
import { he } from '@/i18n/he';

interface ModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export function Modal({
  open,
  title,
  message,
  confirmLabel = he.common.save,
  cancelLabel = he.common.cancel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-notion-bg border border-notion-border rounded-2xl p-5 shadow-notion-lg max-w-sm w-full animate-slide-in">
        <h3 className="text-base font-semibold text-notion-text mb-2 text-right">{title}</h3>
        <p className="text-sm text-notion-muted mb-5 text-right leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-start">
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
