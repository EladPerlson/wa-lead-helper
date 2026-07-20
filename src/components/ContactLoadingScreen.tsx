import { he } from '@/i18n/he';

export function ContactLoadingScreen() {
  return (
    <div className="wa-lh-contact-loading-main" dir="rtl">
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-notion-muted">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-[14px] border-2 border-notion-accent/20" />
          <div className="absolute inset-0 rounded-[14px] border-2 border-transparent border-t-notion-accent animate-spin" />
        </div>
        <span className="text-sm font-medium">{he.contact.loadingDetails}</span>
        <div className="w-32 h-1 rounded overflow-hidden bg-notion-surface">
          <div className="h-full w-1/2 wa-lh-shimmer rounded" />
        </div>
      </div>
    </div>
  );
}
