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
      className="w-[320px] min-h-[200px] bg-notion-bg text-notion-text font-heebo p-5"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', Arial, sans-serif" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-notion-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
          WA
        </div>
        <div className="text-right flex-1">
          <h1 className="text-lg font-bold">{he.popup.title}</h1>
          <p className="text-xs text-notion-muted">{he.popup.subtitle}</p>
        </div>
      </div>

      <div className="bg-notion-surface border border-notion-border rounded-xl p-3 mb-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-600 font-medium">{he.popup.active}</span>
          <span className="text-notion-muted">{he.popup.status}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">{contactsCount}</span>
          <span className="text-notion-muted">{he.popup.contactsCount}</span>
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
        className="block text-center text-xs text-notion-muted hover:text-notion-accent mt-4 hover:underline"
      >
        {he.popup.privacyPolicy}
      </a>
    </div>
  );
}
