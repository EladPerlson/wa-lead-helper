import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { he } from '@/i18n/he';
import { getContactsCount } from '@/storage';
import { PRIVACY_POLICY_URL } from '@/constants/urls';

const WHATSAPP_URL = 'https://web.whatsapp.com/';

export function Popup() {
  const { settings } = useSettings();
  const [contactsCount, setContactsCount] = useState(0);

  useTheme(settings.darkMode);

  useEffect(() => {
    getContactsCount().then(setContactsCount);
  }, []);

  const openWhatsApp = () => {
    chrome.tabs.create({ url: WHATSAPP_URL });
  };

  return (
    <div
      className="wa-lh-shell w-[320px] min-h-[240px] text-notion-text font-heebo p-5"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Outfit', Arial, sans-serif" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-[14px] wa-lh-accent-gradient text-brand-mist flex items-center justify-center font-bold text-sm shrink-0 wa-lh-brand shadow-[0_8px_20px_rgba(0,173,181,0.3)]">
          WA
        </div>
        <div className="text-right flex-1">
          <h1 className="text-lg font-bold wa-lh-brand tracking-wide">{he.popup.title}</h1>
          <p className="text-xs text-notion-muted">{he.popup.subtitle}</p>
        </div>
      </div>

      <div className="wa-lh-surface rounded-[16px] p-3.5 mb-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="inline-flex items-center gap-1.5 text-notion-success font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-notion-success" />
            {he.popup.active}
          </span>
          <span className="text-notion-muted text-xs">{he.popup.status}</span>
        </div>
        <div className="h-px bg-notion-border" />
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-notion-accent tabular-nums text-base">{contactsCount}</span>
          <span className="text-notion-muted text-xs">{he.popup.contactsCount}</span>
        </div>
      </div>

      <p className="text-xs text-notion-muted text-right mb-4 leading-relaxed">{he.popup.goToWhatsApp}</p>

      <Button className="w-full" onClick={openWhatsApp}>
        {he.popup.openWhatsApp}
      </Button>

      <a
        href={PRIVACY_POLICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-notion-muted hover:text-notion-accent mt-4 transition-colors"
      >
        {he.popup.privacyPolicy}
      </a>
    </div>
  );
}
