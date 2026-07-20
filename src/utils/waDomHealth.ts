import {
  detectCurrentContact,
  getMessageInput,
  isWhatsAppShellReady,
  isWhatsAppChatOpen,
  getChatHeaderElement,
  setInjectResultHandler,
} from '@/utils/waDom';

export type WaDomIssue =
  | 'shell_missing'
  | 'chat_controls_missing'
  | 'inject_failed'
  | 'detect_failed';

export type WaDomHealthStatus = 'ok' | 'degraded' | 'broken';

export interface WaDomHealthState {
  status: WaDomHealthStatus;
  issues: WaDomIssue[];
  checkedAt: number;
}

type HealthListener = (state: WaDomHealthState) => void;

const CHECK_INTERVAL_MS = 4000;
const FAIL_STREAK_TO_BREAK = 3;
const INJECT_FAIL_WINDOW_MS = 90_000;
const INJECT_FAILS_DEGRADED = 2;
const INJECT_FAILS_BROKEN = 3;

const listeners = new Set<HealthListener>();
let current: WaDomHealthState = { status: 'ok', issues: [], checkedAt: Date.now() };
let shellFailStreak = 0;
let chatControlsFailStreak = 0;
let detectFailStreak = 0;
const injectFailTimes: number[] = [];

function publish(next: WaDomHealthState) {
  const changed =
    next.status !== current.status ||
    next.issues.length !== current.issues.length ||
    next.issues.some((issue, i) => issue !== current.issues[i]);

  current = next;
  if (!changed) return;
  listeners.forEach((fn) => {
    try {
      fn(current);
    } catch {
      // ignore listener errors
    }
  });
}

function pruneInjectFails(now: number) {
  while (injectFailTimes.length > 0 && now - injectFailTimes[0] > INJECT_FAIL_WINDOW_MS) {
    injectFailTimes.shift();
  }
}

/** Call after a successful text injection into WhatsApp. */
export function recordInjectSuccess(): void {
  injectFailTimes.length = 0;
  if (current.issues.includes('inject_failed')) {
    runHealthCheck();
  }
}

/** Call when injectTextToWhatsApp fails or verification fails. */
export function recordInjectFailure(): void {
  injectFailTimes.push(Date.now());
  runHealthCheck();
}

export function getWaDomHealth(): WaDomHealthState {
  return current;
}

export function onWaDomHealthChange(listener: HealthListener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export function runHealthCheck(): WaDomHealthState {
  const now = Date.now();
  const issues: WaDomIssue[] = [];

  pruneInjectFails(now);

  if (!isWhatsAppShellReady()) {
    // WhatsApp still loading — don't alarm yet
    shellFailStreak = 0;
    chatControlsFailStreak = 0;
    detectFailStreak = 0;
    publish({ status: 'ok', issues: [], checkedAt: now });
    return current;
  }

  // Shell present but chat list DOM missing → WA layout changed
  const hasChatList =
    Boolean(document.querySelector('#pane-side')) ||
    Boolean(document.querySelector('#side')) ||
    Boolean(document.querySelector('[data-testid="chat-list"]')) ||
    Boolean(document.querySelector('[aria-label*="Chat list" i]')) ||
    Boolean(document.querySelector('[aria-label*="רשימת הצ\'אטים"]'));

  if (!hasChatList) {
    shellFailStreak += 1;
  } else {
    shellFailStreak = 0;
  }

  if (shellFailStreak >= FAIL_STREAK_TO_BREAK) {
    issues.push('shell_missing');
  }

  const chatOpen = isWhatsAppChatOpen();
  if (chatOpen) {
    const hasInput = Boolean(getMessageInput());
    const hasHeader = Boolean(getChatHeaderElement());

    if (!hasInput && !hasHeader) {
      chatControlsFailStreak += 1;
    } else {
      chatControlsFailStreak = 0;
    }

    if (chatControlsFailStreak >= FAIL_STREAK_TO_BREAK) {
      issues.push('chat_controls_missing');
    }

    // Header/input exist but we still can't resolve a contact
    if ((hasInput || hasHeader) && !detectCurrentContact()) {
      detectFailStreak += 1;
    } else {
      detectFailStreak = 0;
    }

    if (detectFailStreak >= FAIL_STREAK_TO_BREAK + 1) {
      issues.push('detect_failed');
    }
  } else {
    chatControlsFailStreak = 0;
    detectFailStreak = 0;
  }

  if (injectFailTimes.length >= INJECT_FAILS_DEGRADED) {
    issues.push('inject_failed');
  }

  let status: WaDomHealthStatus = 'ok';
  if (issues.length > 0) {
    const critical =
      issues.includes('shell_missing') ||
      issues.includes('chat_controls_missing') ||
      injectFailTimes.length >= INJECT_FAILS_BROKEN;
    status = critical ? 'broken' : 'degraded';
  }

  publish({ status, issues, checkedAt: now });
  return current;
}

export function startWaDomHealthMonitor(): () => void {
  setInjectResultHandler((ok) => {
    if (ok) recordInjectSuccess();
    else recordInjectFailure();
  });

  runHealthCheck();
  const interval = setInterval(runHealthCheck, CHECK_INTERVAL_MS);

  return () => {
    clearInterval(interval);
    setInjectResultHandler(null);
  };
}
