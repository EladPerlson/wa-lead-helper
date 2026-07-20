import { Button } from '@/components/Button';
import { he } from '@/i18n/he';
import type { ChatInsights, ChatIntent } from '@/utils/openai';

interface AiInsightsModalProps {
  open: boolean;
  loading: boolean;
  mode: 'summary' | 'insights';
  summary?: string;
  insights?: ChatInsights | null;
  error: string | null;
  tagLabels?: Record<string, string>;
  onClose: () => void;
  onRegenerate: () => void;
  onApplyTags?: (tagIds: string[]) => void;
  onAppendFacts?: (facts: string[]) => void;
}

function intentLabel(intent: ChatIntent): string {
  switch (intent) {
    case 'price':
      return he.ai.intentPrice;
    case 'appointment':
      return he.ai.intentAppointment;
    case 'not_interested':
      return he.ai.intentNotInterested;
    default:
      return he.ai.intentOther;
  }
}

export function AiInsightsModal({
  open,
  loading,
  mode,
  summary,
  insights,
  error,
  tagLabels = {},
  onClose,
  onRegenerate,
  onApplyTags,
  onAppendFacts,
}: AiInsightsModalProps) {
  if (!open) return null;

  const title = mode === 'summary' ? he.ai.summaryTitle : he.ai.insightsTitle;
  const subtitle = mode === 'summary' ? he.ai.summarySubtitle : he.ai.insightsSubtitle;
  const loadingText = mode === 'summary' ? he.ai.summaryLoading : he.ai.insightsLoading;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-notion-bg border border-notion-border rounded-2xl p-5 shadow-notion-lg max-w-md w-full animate-slide-in space-y-3 max-h-[85vh] overflow-y-auto">
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
            <h3 className="text-base font-semibold text-notion-text">{title}</h3>
            <p className="text-xs text-notion-muted mt-0.5">{subtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-notion-muted animate-pulse">{loadingText}</p>
          </div>
        ) : error ? (
          <p className="text-sm text-notion-danger text-right leading-relaxed">{error}</p>
        ) : mode === 'summary' ? (
          <p className="text-sm text-notion-text text-right leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        ) : insights ? (
          <div className="space-y-3 text-right">
            <div>
              <p className="text-xs text-notion-muted mb-1">{he.ai.intentLabel}</p>
              <p className="text-sm font-semibold text-notion-text">{intentLabel(insights.intent)}</p>
            </div>

            {insights.suggestedTagIds.length > 0 && (
              <div>
                <p className="text-xs text-notion-muted mb-1.5">{he.ai.suggestedTags}</p>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {insights.suggestedTagIds.map((id) => (
                    <span
                      key={id}
                      className="text-xs px-2 py-1 rounded-lg bg-notion-soft text-notion-text"
                    >
                      {tagLabels[id] ?? id}
                    </span>
                  ))}
                </div>
                {onApplyTags && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => onApplyTags(insights.suggestedTagIds)}
                  >
                    {he.ai.applyTags}
                  </Button>
                )}
              </div>
            )}

            {insights.facts.length > 0 && (
              <div>
                <p className="text-xs text-notion-muted mb-1.5">{he.ai.factsLabel}</p>
                <ul className="space-y-1">
                  {insights.facts.map((f, i) => (
                    <li key={i} className="text-sm text-notion-text">
                      • {f}
                    </li>
                  ))}
                </ul>
                {onAppendFacts && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => onAppendFacts(insights.facts)}
                  >
                    {he.ai.appendFacts}
                  </Button>
                )}
              </div>
            )}

            {insights.suggestedTagIds.length === 0 && insights.facts.length === 0 && (
              <p className="text-sm text-notion-muted">{he.ai.noInsights}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-notion-muted text-right">{he.ai.noInsights}</p>
        )}

        <div className="flex flex-wrap gap-2 justify-start pt-1">
          <Button variant="secondary" onClick={onRegenerate} disabled={loading}>
            {loading ? loadingText : he.ai.regenerate}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {he.common.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
