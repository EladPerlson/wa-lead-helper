import { type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { he } from '@/i18n/he';

interface AiAskModalProps {
  open: boolean;
  loading: boolean;
  question: string;
  answer: string;
  error: string | null;
  onQuestionChange: (value: string) => void;
  onAsk: () => void;
  onClose: () => void;
}

const EXAMPLE_QUESTIONS = [
  'מה המחיר שדיברנו עליו?',
  'מתי הלקוח ביקש שנחזור אליו?',
  'יש מספר הזמנה או כתובת בשיחה?',
];

export function AiAskModal({
  open,
  loading,
  question,
  answer,
  error,
  onQuestionChange,
  onAsk,
  onClose,
}: AiAskModalProps) {
  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loading && question.trim()) onAsk();
  };

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
            <h3 className="text-base font-semibold text-notion-text">{he.ai.askTitle}</h3>
            <p className="text-xs text-notion-muted mt-0.5">{he.ai.askSubtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder={he.ai.askPlaceholder}
            className="w-full min-h-[72px] text-sm text-notion-text bg-notion-surface border border-notion-border rounded-xl p-3 text-right leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-notion-accent/40"
            dir="rtl"
            disabled={loading}
          />

          {!answer && !loading && !error && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onQuestionChange(q)}
                  className="text-[11px] px-2 py-1 rounded-full border border-notion-border text-notion-muted hover:text-notion-accent hover:border-notion-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <p className="text-sm text-notion-muted text-center animate-pulse py-4">
              {he.ai.askLoading}
            </p>
          )}

          {error && !loading && (
            <p className="text-sm text-notion-danger text-right leading-relaxed">{error}</p>
          )}

          {!loading && answer && (
            <div className="rounded-xl border border-notion-border bg-notion-surface p-3">
              <p className="text-[11px] font-medium text-notion-muted mb-1.5 text-right">
                {he.ai.askAnswerLabel}
              </p>
              <p className="text-sm text-notion-text text-right leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-start pt-1">
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? he.ai.askLoading : answer ? he.ai.askAgain : he.ai.askSubmit}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              {he.common.close}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
