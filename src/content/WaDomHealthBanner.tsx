import { useEffect, useState } from 'react';
import {
  onWaDomHealthChange,
  runHealthCheck,
  type WaDomHealthState,
  type WaDomIssue,
} from '@/utils/waDomHealth';
import { he } from '@/i18n/he';

function issueMessage(issue: WaDomIssue): string {
  switch (issue) {
    case 'shell_missing':
      return he.waDomHealth.issues.shellMissing;
    case 'chat_controls_missing':
      return he.waDomHealth.issues.chatControlsMissing;
    case 'inject_failed':
      return he.waDomHealth.issues.injectFailed;
    case 'detect_failed':
      return he.waDomHealth.issues.detectFailed;
    default:
      return he.waDomHealth.issues.generic;
  }
}

export function WaDomHealthBanner() {
  const [health, setHealth] = useState<WaDomHealthState | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    return onWaDomHealthChange(setHealth);
  }, []);

  if (!health || health.status === 'ok') return null;

  const key = `${health.status}:${health.issues.join(',')}`;
  if (dismissedKey === key && health.status === 'degraded') return null;

  const primaryIssue = health.issues[0];
  const detail = primaryIssue ? issueMessage(primaryIssue) : he.waDomHealth.issues.generic;
  const isBroken = health.status === 'broken';

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[10002] max-w-md w-[calc(100%-2rem)] bg-notion-bg border border-amber-500/40 rounded-xl shadow-notion-lg p-4 font-heebo"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Outfit', Arial, sans-serif" }}
      role="alert"
    >
      <p className="text-sm font-semibold text-notion-text text-right mb-1">
        {isBroken ? he.waDomHealth.titleBroken : he.waDomHealth.titleDegraded}
      </p>
      <p className="text-xs text-notion-muted text-right leading-relaxed mb-1">
        {he.waDomHealth.message}
      </p>
      <p className="text-xs text-amber-600 dark:text-amber-400 text-right leading-relaxed mb-3">
        {detail}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 py-2 px-3 bg-notion-accent text-white text-sm font-medium rounded-xl hover:bg-notion-accentHover transition-colors"
        >
          {he.waDomHealth.refresh}
        </button>
        <button
          type="button"
          onClick={() => {
            runHealthCheck();
            if (!isBroken) setDismissedKey(key);
          }}
          className="py-2 px-3 text-sm font-medium rounded-xl border border-notion-border text-notion-muted hover:text-notion-text hover:bg-notion-soft transition-colors"
        >
          {isBroken ? he.waDomHealth.recheck : he.common.close}
        </button>
      </div>
    </div>
  );
}
