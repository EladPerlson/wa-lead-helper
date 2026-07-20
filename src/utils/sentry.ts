import { getStorageItem } from '@/storage';
import { SENTRY_DSN as CONFIG_DSN } from '@/supabase/config';

type CaptureFn = (payload: unknown) => void;

let captureEx: CaptureFn | null = null;
let captureMsg: CaptureFn | null = null;
let initAttempted = false;

/**
 * Optional Sentry — no-op when DSN is missing or @sentry/browser is not installed.
 * Avoids a hard dependency so builds succeed without the package.
 */
export async function initSentryFromSettings(): Promise<void> {
  if (initAttempted) return;
  initAttempted = true;

  const settings = await getStorageItem('settings');
  const dsn = (settings?.sentryDsn || CONFIG_DSN || '').trim();
  if (!dsn) return;

  try {
    // Runtime-only load; package is optional (npm i @sentry/browser to enable).
    const loader = new Function('m', 'return import(m)') as (m: string) => Promise<{
      init: (opts: { dsn: string; tracesSampleRate?: number }) => void;
      captureException: CaptureFn;
      captureMessage: CaptureFn;
    }>;
    const mod = await loader('@sentry/browser');
    mod.init({ dsn, tracesSampleRate: 0.05 });
    captureEx = mod.captureException.bind(mod);
    captureMsg = mod.captureMessage.bind(mod);
  } catch {
    captureEx = null;
    captureMsg = null;
  }
}

export function captureException(error: unknown): void {
  try {
    captureEx?.(error);
  } catch {
    // ignore
  }
}

export function captureMessage(message: string): void {
  try {
    captureMsg?.(message);
  } catch {
    // ignore
  }
}
