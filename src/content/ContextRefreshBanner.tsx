import { useEffect, useState } from 'react';
import { onContextInvalidated } from '@/utils/extensionContext';
import { he } from '@/i18n/he';

export function ContextRefreshBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    return onContextInvalidated(() => setShow(true));
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[10002] max-w-sm w-[calc(100%-2rem)] bg-notion-bg border border-notion-border rounded-xl shadow-notion-lg p-4 font-heebo"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', Arial, sans-serif" }}
    >
      <p className="text-sm font-semibold text-notion-text text-right mb-1">
        {he.contextInvalidated.title}
      </p>
      <p className="text-xs text-notion-muted text-right leading-relaxed mb-3">
        {he.contextInvalidated.message}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="w-full py-2 px-4 bg-notion-accent text-white text-sm font-medium rounded-xl hover:bg-notion-accentHover transition-colors"
      >
        {he.contextInvalidated.refresh}
      </button>
    </div>
  );
}
