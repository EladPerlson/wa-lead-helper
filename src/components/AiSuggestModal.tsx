import { Button } from '@/components/Button';
import { he } from '@/i18n/he';

interface AiSuggestModalProps {
  open: boolean;
  loading: boolean;
  suggestion: string;
  error: string | null;
  onInsert: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
}

export function AiSuggestModal({
  open,
  loading,
  suggestion,
  error,
  onInsert,
  onRegenerate,
  onClose,
  onChange,
}: AiSuggestModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-notion-bg border border-notion-border rounded-2xl p-5 shadow-notion-lg max-w-md w-full animate-slide-in space-y-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-notion-muted hover:text-notion-text text-lg leading-none px-1"
            aria-label={he.common.close}
          >
            ×
          </button>
          <div className="text-right flex-1">
            <h3 className="text-base font-semibold text-notion-text">{he.ai.title}</h3>
            <p className="text-xs text-notion-muted mt-0.5">{he.ai.subtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-notion-muted animate-pulse">{he.ai.loading}</p>
          </div>
        ) : error ? (
          <p className="text-sm text-notion-danger text-right leading-relaxed">{error}</p>
        ) : (
          <textarea
            value={suggestion}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[120px] text-sm text-notion-text bg-notion-surface border border-notion-border rounded-xl p-3 text-right leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-notion-accent/40"
            dir="rtl"
          />
        )}

        <div className="flex flex-wrap gap-2 justify-start pt-1">
          {!loading && !error && suggestion && (
            <Button onClick={onInsert}>{he.ai.insert}</Button>
          )}
          <Button variant="secondary" onClick={onRegenerate} disabled={loading}>
            {loading ? he.ai.loading : he.ai.regenerate}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
