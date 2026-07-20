import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { AiSuggestModal } from '@/components/AiSuggestModal';
import { UpgradeModal, type UpgradeReason } from '@/components/UpgradeModal';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useSubscription } from '@/hooks/useSubscription';
import { useContactData } from '@/hooks/useContactData';
import { useTags } from '@/hooks/useStorageLists';
import { he } from '@/i18n/he';
import { suggestReplyWithOpenAI } from '@/utils/openai';
import { detectCurrentContact, injectTextToWhatsApp, readChatMessages } from '@/utils/waDom';

function dismissKey(phone: string): string {
  return `wa-lh-ai-offer-dismissed:${phone}`;
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
    case 'limit_reached':
      return he.ai.limitReached;
    default:
      return he.ai.apiError;
  }
}

/**
 * Floating offer above WhatsApp composer: "Want to reply with AI?"
 * X dismisses for this chat (session). "Don't suggest again" disables permanently.
 */
export function ChatAiOffer() {
  const auth = useAuth();
  const { settings, updateSettings } = useSettings();
  const subscription = useSubscription(auth.session);
  const offerEnabled = settings.showChatAiOffer !== false;
  const [phone, setPhone] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [visible, setVisible] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>('ai');

  const { contact } = useContactData(phone, displayName);
  const { tags } = useTags();

  useEffect(() => {
    if (!auth.session || !offerEnabled) {
      setVisible(false);
      return;
    }

    const sync = () => {
      const detected = detectCurrentContact();
      if (!detected) {
        setPhone(null);
        setVisible(false);
        return;
      }
      setPhone(detected.phoneNumber);
      setDisplayName(detected.displayName);
      try {
        if (sessionStorage.getItem(dismissKey(detected.phoneNumber))) {
          setVisible(false);
          return;
        }
      } catch {
        // ignore
      }
      setVisible(true);
    };

    sync();
    const id = window.setInterval(sync, 1500);
    return () => clearInterval(id);
  }, [auth.session, offerEnabled]);

  const dismissForChat = useCallback(() => {
    if (phone) {
      try {
        sessionStorage.setItem(dismissKey(phone), '1');
      } catch {
        // ignore
      }
    }
    setVisible(false);
  }, [phone]);

  const neverSuggestAgain = useCallback(async () => {
    setVisible(false);
    await updateSettings({ showChatAiOffer: false });
  }, [updateSettings]);

  const runSuggest = async () => {
    if (subscription.aiUsage?.allowed === false) {
      setUpgradeReason('ai');
      setUpgradeOpen(true);
      return;
    }

    setAiOpen(true);
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion('');
    setVisible(false);

    const messages = readChatMessages(40);
    const tagLabels = (contact?.tags ?? [])
      .map((id) => tags.find((t) => t.id === id)?.label)
      .filter((label): label is string => Boolean(label));

    const result = await suggestReplyWithOpenAI({
      customerName: contact?.displayName ?? displayName,
      appUserLabel: auth.session?.user?.email,
      notes: contact?.notes,
      tags: tagLabels,
      messages,
    });

    setAiLoading(false);
    await subscription.refresh();

    if (result.error === 'limit_reached') {
      setAiOpen(false);
      setUpgradeReason('ai');
      setUpgradeOpen(true);
      return;
    }
    if (result.error) {
      setAiError(translateAiError(result.error));
      return;
    }
    setAiSuggestion(result.text);
  };

  const handleInsert = () => {
    if (!aiSuggestion.trim()) return;
    if (injectTextToWhatsApp(aiSuggestion.trim())) {
      setAiOpen(false);
      dismissForChat();
    }
  };

  if (!auth.session) return null;

  return (
    <>
      {visible && !aiOpen && !upgradeOpen && (
        <div
          id="wa-lh-chat-ai-offer"
          className="fixed z-[9990] bottom-24 left-[max(16px,calc(50%-210px))] max-w-[min(400px,calc(100vw-360px))] w-full px-3"
          dir="rtl"
          style={{ fontFamily: "'Heebo', 'Outfit', Arial, sans-serif" }}
        >
          <div className="bg-notion-bg border border-notion-accent/35 rounded-[16px] px-3 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={dismissForChat}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-notion-muted hover:bg-notion-soft hover:text-notion-text shrink-0 text-lg leading-none"
                aria-label={he.common.close}
                title={he.common.close}
              >
                ✕
              </button>
              <div className="flex-1 text-right min-w-0">
                <p className="text-sm font-semibold text-notion-text">{he.chatAiOffer.title}</p>
                <p className="text-xs text-notion-muted mt-0.5">{he.chatAiOffer.subtitle}</p>
              </div>
              <Button size="sm" onClick={() => void runSuggest()} disabled={aiLoading} className="shrink-0">
                {he.chatAiOffer.yes}
              </Button>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => void neverSuggestAgain()}
                className="text-[11px] text-notion-muted hover:text-notion-accent underline-offset-2 hover:underline"
              >
                {he.chatAiOffer.neverAgain}
              </button>
            </div>
          </div>
        </div>
      )}

      <AiSuggestModal
        open={aiOpen}
        loading={aiLoading}
        suggestion={aiSuggestion}
        error={aiError}
        onInsert={handleInsert}
        onRegenerate={() => void runSuggest()}
        onClose={() => setAiOpen(false)}
        onChange={setAiSuggestion}
      />

      <UpgradeModal
        open={upgradeOpen}
        reason={upgradeReason}
        userEmail={auth.session.user.email}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  );
}
