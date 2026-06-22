import { he } from '@/i18n/he';

export function ContactLoadingScreen() {
  return (
    <div className="wa-lh-contact-loading-main" dir="rtl">
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-notion-muted">
        <div className="w-10 h-10 rounded-full border-2 border-notion-border border-t-notion-accent animate-spin" />
        <span className="text-sm font-medium">{he.contact.loadingDetails}</span>
      </div>
    </div>
  );
}
