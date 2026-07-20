import { useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox';
import { Textarea } from '@/components/Textarea';
import { Card } from '@/components/Card';
import { AiSuggestModal } from '@/components/AiSuggestModal';
import { AiAskModal } from '@/components/AiAskModal';
import { AiInsightsModal } from '@/components/AiInsightsModal';
import { useTemplates, useTags } from '@/hooks/useStorageLists';
import { useAuth } from '@/hooks/useAuth';
import { he } from '@/i18n/he';
import type { ContactData } from '@/types';
import { generateId } from '@/utils/id';
import { injectTextToWhatsApp, readChatMessages } from '@/utils/waDom';
import {
  analyzeChatInsightsWithOpenAI,
  askChatQuestionWithOpenAI,
  suggestReplyWithOpenAI,
  summarizeChatWithOpenAI,
  type ChatInsights,
} from '@/utils/openai';
import type { PlanLimits } from '@/plans';
import { isUnlimited, formatLimit } from '@/plans';
import { canAddTemplate } from '@/utils/limits';
import type { SubscriptionState } from '@/hooks/useSubscription';
import type { UpgradeReason } from '@/components/UpgradeModal';

interface QuickRepliesPanelProps {
  contact: ContactData | null;
  limits: PlanLimits;
  subscription?: SubscriptionState;
  onUpdate: (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => Promise<ContactData | null>;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onUpgradeNeeded?: (reason: UpgradeReason) => void;
}

function translateAiError(code: string | undefined): string {
  switch (code) {
    case 'missing_key':
      return he.ai.missingKey;
    case 'no_messages':
      return he.ai.noMessages;
    case 'invalid_key':
      return he.ai.invalidKey;
    case 'rate_limit':
      return he.ai.rateLimit;
    case 'network':
      return he.ai.network;
    case 'empty':
      return he.ai.empty;
    case 'empty_question':
      return he.ai.emptyQuestion;
    case 'limit_reached':
      return he.ai.limitReached;
    default:
      return he.ai.apiError;
  }
}

export function QuickRepliesPanel({
  contact,
  limits,
  subscription,
  onUpdate,
  onToast,
  onUpgradeNeeded,
}: QuickRepliesPanelProps) {
  const { templates, addTemplate, removeTemplate } = useTemplates();
  const { tags } = useTags();
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  const [askOpen, setAskOpen] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askError, setAskError] = useState<string | null>(null);

  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsMode, setInsightsMode] = useState<'summary' | 'insights'>('summary');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [insightsData, setInsightsData] = useState<ChatInsights | null>(null);

  const aiBusy = aiLoading || askLoading || insightsLoading;
  const aiLimitBlocked = subscription?.aiUsage?.allowed === false;

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.trim().toLowerCase();
    return templates.filter((t) => t.text.toLowerCase().includes(q));
  }, [templates, search]);

  const buildContext = (messageLimit: number) => {
    const messages = readChatMessages(messageLimit);
    const tagLabels = (contact?.tags ?? [])
      .map((id) => tags.find((t) => t.id === id)?.label)
      .filter((label): label is string => Boolean(label));
    return {
      customerName: contact?.displayName,
      appUserLabel: auth.session?.user?.email,
      notes: contact?.notes,
      tags: tagLabels,
      messages,
    };
  };

  const handleInsert = async (text: string) => {
    const success = injectTextToWhatsApp(text);
    if (success) {
      if (contact) {
        await onUpdate({ templatesUsed: (contact.templatesUsed ?? 0) + 1 });
      }
      onToast(he.replies.inserted, 'success');
    } else {
      onToast(he.common.error, 'error');
    }
  };

  const runAiSuggest = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion('');

    const result = await suggestReplyWithOpenAI(buildContext(40));

    setAiLoading(false);
    await subscription?.refresh();

    if (result.error) {
      if (result.error === 'limit_reached') onUpgradeNeeded?.('ai');
      setAiError(translateAiError(result.error));
      return;
    }
    setAiSuggestion(result.text);
  };

  const runAiAsk = async () => {
    setAskOpen(true);
    setAskLoading(true);
    setAskError(null);
    setAskAnswer('');

    const result = await askChatQuestionWithOpenAI({
      ...buildContext(60),
      question: askQuestion,
    });

    setAskLoading(false);
    await subscription?.refresh();

    if (result.error) {
      if (result.error === 'limit_reached') onUpgradeNeeded?.('ai');
      setAskError(translateAiError(result.error));
      return;
    }
    setAskAnswer(result.text);
  };

  const runSummary = async () => {
    setInsightsMode('summary');
    setInsightsOpen(true);
    setInsightsLoading(true);
    setInsightsError(null);
    setSummaryText('');

    const result = await summarizeChatWithOpenAI(buildContext(50));
    setInsightsLoading(false);
    await subscription?.refresh();

    if (result.error) {
      if (result.error === 'limit_reached') onUpgradeNeeded?.('ai');
      setInsightsError(translateAiError(result.error));
      return;
    }
    setSummaryText(result.text);
  };

  const runInsights = async () => {
    setInsightsMode('insights');
    setInsightsOpen(true);
    setInsightsLoading(true);
    setInsightsError(null);
    setInsightsData(null);

    const result = await analyzeChatInsightsWithOpenAI(buildContext(50));
    setInsightsLoading(false);
    await subscription?.refresh();

    if (result.error) {
      if (result.error === 'limit_reached') onUpgradeNeeded?.('ai');
      setInsightsError(translateAiError(result.error));
      return;
    }
    setInsightsData(result.insights);
  };

  const handleApplySuggestedTags = async (tagIds: string[]) => {
    if (!contact) return;
    const merged = Array.from(new Set([...contact.tags, ...tagIds]));
    await onUpdate({ tags: merged });
    onToast(he.ai.tagsApplied, 'success');
  };

  const handleAppendFacts = async (facts: string[]) => {
    if (!contact || facts.length === 0) return;
    const block = facts.map((f) => `• ${f}`).join('\n');
    const next = contact.notes.trim()
      ? `${contact.notes.trim()}\n\n— AI —\n${block}`
      : `— AI —\n${block}`;
    await onUpdate({ notes: next });
    onToast(he.ai.factsAppended, 'success');
  };

  const handleAiInsert = async () => {
    if (!aiSuggestion.trim()) return;
    await handleInsert(aiSuggestion.trim());
    setAiOpen(false);
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    if (!(await canAddTemplate(limits, templates.length))) {
      onUpgradeNeeded?.('replies');
      onToast(he.replies.limitReached, 'error');
      return;
    }
    await addTemplate({
      id: generateId('tpl'),
      text: newText.trim(),
      createdAt: new Date().toISOString(),
    });
    setNewText('');
    setShowAdd(false);
    onToast(he.common.success, 'success');
  };

  const usageLabel = (() => {
    const usage = subscription?.aiUsage;
    const lim = limits.aiSuggestions;
    if (isUnlimited(lim)) return he.ai.usageUnlimited;
    if (!usage) return `${he.pricing.usageAi}: ?/${formatLimit(lim)}`;
    return `${he.pricing.usageAi}: ${usage.used}/${formatLimit(usage.limit ?? lim)}`;
  })();

  return (
    <div className="p-4 space-y-5 animate-rise" dir="rtl">
      <div className="wa-lh-section-label">
        <span>{he.replies.title}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          className="wa-lh-tile is-primary col-span-2 p-3.5 text-right disabled:opacity-50"
          onClick={() => {
            if (aiLimitBlocked) {
              onUpgradeNeeded?.('ai');
              return;
            }
            void runAiSuggest();
          }}
          disabled={aiBusy}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl wa-lh-accent-gradient text-brand-mist text-base">
              ✦
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-notion-text leading-snug">{he.replies.aiSuggest}</p>
              <p className="text-[11px] text-notion-muted mt-1">תשובה מומלצת לפי השיחה</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          className="wa-lh-tile p-3 text-right disabled:opacity-50"
          onClick={() => {
            if (aiLimitBlocked) {
              onUpgradeNeeded?.('ai');
              return;
            }
            setAskOpen(true);
            setAskError(null);
            setAskAnswer('');
          }}
          disabled={aiBusy}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-notion-soft text-notion-accent text-xs mb-2">
            ⌕
          </span>
          <p className="text-xs font-bold text-notion-text leading-snug">{he.replies.aiAsk}</p>
        </button>

        <button
          type="button"
          className="wa-lh-tile p-3 text-right disabled:opacity-50"
          onClick={() => {
            if (aiLimitBlocked) {
              onUpgradeNeeded?.('ai');
              return;
            }
            void runSummary();
          }}
          disabled={aiBusy}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-notion-soft text-notion-accent text-xs mb-2">
            ▤
          </span>
          <p className="text-xs font-bold text-notion-text leading-snug">{he.replies.aiSummary}</p>
        </button>

        <button
          type="button"
          className="wa-lh-tile col-span-2 p-3 text-right disabled:opacity-50"
          onClick={() => {
            if (aiLimitBlocked) {
              onUpgradeNeeded?.('ai');
              return;
            }
            void runInsights();
          }}
          disabled={aiBusy}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-notion-soft text-notion-accent text-xs">
              ◈
            </span>
            <p className="text-xs font-bold text-notion-text leading-snug flex-1">{he.replies.aiInsights}</p>
          </div>
        </button>

        <p className="col-span-2 text-[11px] text-notion-muted text-right px-0.5">{usageLabel}</p>
        {aiLimitBlocked && (
          <p className="col-span-2 text-[11px] text-notion-danger text-right px-0.5">{he.ai.limitReached}</p>
        )}
      </div>

      <SearchBox
        label={he.replies.search}
        placeholder={he.replies.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2 max-h-[220px] overflow-y-auto wa-lh-scroll">
        {filtered.length === 0 ? (
          <p className="text-xs text-notion-muted text-right">
            {search ? he.replies.noResults : he.replies.empty}
          </p>
        ) : (
          filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="wa-lh-tile p-3.5 cursor-pointer group"
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => removeTemplate(tpl.id)}
                  className="opacity-0 group-hover:opacity-100 text-notion-muted hover:text-notion-danger text-xs shrink-0 transition-opacity mt-0.5"
                  title={he.replies.delete}
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => handleInsert(tpl.text)}
                  className="flex-1 text-sm text-notion-text text-right leading-relaxed hover:text-notion-accent transition-colors"
                >
                  {tpl.text}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!showAdd ? (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            if (!isUnlimited(limits.templates) && templates.length >= limits.templates) {
              onUpgradeNeeded?.('replies');
              return;
            }
            setShowAdd(true);
          }}
        >
          + {he.replies.add}
        </Button>
      ) : (
        <Card glass={false}>
          <div className="space-y-3">
            <Textarea
              placeholder={he.replies.addPlaceholder}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>
                {he.replies.add}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                {he.common.cancel}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <AiSuggestModal
        open={aiOpen}
        loading={aiLoading}
        suggestion={aiSuggestion}
        error={aiError}
        onInsert={() => void handleAiInsert()}
        onRegenerate={() => void runAiSuggest()}
        onClose={() => setAiOpen(false)}
        onChange={setAiSuggestion}
      />

      <AiAskModal
        open={askOpen}
        loading={askLoading}
        question={askQuestion}
        answer={askAnswer}
        error={askError}
        onQuestionChange={setAskQuestion}
        onAsk={() => void runAiAsk()}
        onClose={() => setAskOpen(false)}
      />

      <AiInsightsModal
        open={insightsOpen}
        loading={insightsLoading}
        mode={insightsMode}
        summary={summaryText}
        insights={insightsData}
        error={insightsError}
        tagLabels={Object.fromEntries(tags.map((t) => [t.id, t.label]))}
        onClose={() => setInsightsOpen(false)}
        onRegenerate={() => void (insightsMode === 'summary' ? runSummary() : runInsights())}
        onApplyTags={(ids) => void handleApplySuggestedTags(ids)}
        onAppendFacts={(facts) => void handleAppendFacts(facts)}
      />
    </div>
  );
}
