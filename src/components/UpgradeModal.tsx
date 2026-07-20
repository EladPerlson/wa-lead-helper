import { Button } from '@/components/Button';
import { PRICING_URL } from '@/constants/urls';
import { he } from '@/i18n/he';

export type UpgradeReason = 'tags' | 'replies' | 'reminders' | 'ai' | 'generic';

interface UpgradeModalProps {
  open: boolean;
  reason: UpgradeReason;
  userEmail?: string;
  onClose: () => void;
}

function reasonMessage(reason: UpgradeReason): string {
  switch (reason) {
    case 'tags':
      return he.upgrade.reasonTags;
    case 'replies':
      return he.upgrade.reasonReplies;
    case 'reminders':
      return he.upgrade.reasonReminders;
    case 'ai':
      return he.upgrade.reasonAi;
    default:
      return he.upgrade.reasonGeneric;
  }
}

export function UpgradeModal({ open, reason, userEmail, onClose }: UpgradeModalProps) {
  if (!open) return null;

  const openPricing = () => {
    const url = new URL(PRICING_URL);
    if (userEmail) url.searchParams.set('email', userEmail);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-brand-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative wa-lh-glass rounded-[20px] p-5 shadow-notion-lg max-w-sm w-full animate-rise space-y-4 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-0.5 wa-lh-accent-gradient" />
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-[16px] wa-lh-accent-gradient flex items-center justify-center text-2xl text-brand-mist shadow-[0_8px_20px_rgba(0,173,181,0.3)]">
            ✦
          </div>
          <h3 className="text-lg font-bold text-notion-text">{he.upgrade.title}</h3>
          <p className="text-sm text-notion-muted leading-relaxed">{reasonMessage(reason)}</p>
          <p className="text-xs text-notion-muted leading-relaxed">{he.upgrade.hint}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={openPricing}>
            {he.upgrade.cta}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {he.upgrade.later}
          </Button>
        </div>
      </div>
    </div>
  );
}
