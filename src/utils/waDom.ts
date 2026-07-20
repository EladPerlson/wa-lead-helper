import type { DetectedContact, ChatDetectionState } from '@/types';
import { normalizeContactKey, isValidPhoneKey, buildNameBasedKey, contactKeysMatch } from './phone';
import { sanitizeDisplayName } from './contactDisplay';
import { contactsReferToSamePerson } from './contactMatch';

const CHAT_HEADER_SELECTORS = [
  '#main header [data-testid="conversation-info-header"] span[title]',
  '#main header [data-testid="conversation-info-header-chat-title"] span',
  '#main header [data-testid="conversation-info-header"] span[dir="auto"]',
  '#main header span[title][dir="auto"]',
  '#main header span[title]',
  '#main header div[role="button"] span[title]',
  '#main header h1 span[title]',
  '#main header h1',
  '#main header [role="button"] span[dir="auto"]',
];

const MESSAGE_INPUT_SELECTORS = [
  '#main footer div[contenteditable="true"][data-tab="10"]',
  '#main footer div[contenteditable="true"][role="textbox"]',
  '#main footer div[contenteditable="true"][data-lexical-editor="true"]',
  '#main footer p[contenteditable="true"]',
  '#main footer div[contenteditable="true"]',
  '#main footer [contenteditable="true"]',
  'div[contenteditable="true"][data-tab="10"]',
  '#main [contenteditable="true"][role="textbox"]',
];

const SEARCH_INPUT_SELECTORS = [
  '#side div[contenteditable="true"][data-tab="3"]',
  '#pane-side div[contenteditable="true"][data-tab="3"]',
  'div[contenteditable="true"][data-tab="3"]',
  '#side [contenteditable="true"][role="textbox"]',
  '#pane-side [contenteditable="true"][role="textbox"]',
];

const GROUP_OR_BROADCAST_SUFFIXES = ['@g.us', '@newsletter', '@broadcast'];

/** True once WhatsApp's main app shell has mounted. */
export function isWhatsAppShellReady(): boolean {
  return Boolean(document.querySelector('#app') || document.querySelector('#whatsapp'));
}

/** Best-effort conversation title element in the open chat header. */
export function getChatHeaderElement(): HTMLElement | null {
  for (const selector of CHAT_HEADER_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) continue;
    const title = el.getAttribute('title')?.trim() || el.textContent?.trim();
    if (title && title.length > 0) return el;
  }
  return null;
}

function stripDataIdPrefix(dataId: string): string {
  return dataId.replace(/^(true|false)_/i, '');
}

function isPersonalChatDataId(dataId: string): boolean {
  const id = stripDataIdPrefix(dataId);
  if (!id) return false;
  if (/^3EB[0-9A-F]+$/i.test(id)) return false;
  if (/^[0-9A-F]{18,}$/i.test(id.replace(/[@.+]/g, ''))) return false;
  if (GROUP_OR_BROADCAST_SUFFIXES.some((s) => id.includes(s))) return false;
  return id.includes('@') || /^\+?\d/.test(id);
}

function findDataIdInTree(root: Element): string | null {
  const own = root.getAttribute('data-id');
  if (own && isPersonalChatDataId(own)) return stripDataIdPrefix(own);

  for (const el of root.querySelectorAll('[data-id]')) {
    const id = el.getAttribute('data-id');
    if (id && isPersonalChatDataId(id)) return stripDataIdPrefix(id);
  }

  let parent = root.parentElement;
  while (parent) {
    const id = parent.getAttribute('data-id');
    if (id && isPersonalChatDataId(id)) return stripDataIdPrefix(id);
    parent = parent.parentElement;
  }

  return null;
}

function getHashChatId(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;

  const patterns = [
    /\/(?:chat|contact|phone|message)\/([^/?]+)/i,
    /@([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = hash.match(pattern);
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      if (isPersonalChatDataId(decoded)) return stripDataIdPrefix(decoded);
    }
  }

  return null;
}

function getSelectedSidebarRow(): HTMLElement | null {
  // Only trust explicit selection — broad tabindex selectors match the wrong row.
  const selected = document.querySelector('#pane-side [aria-selected="true"]');
  if (selected) return selected as HTMLElement;

  const cellSelected = document.querySelector(
    '#pane-side [data-testid="cell-frame-container"][aria-selected="true"]',
  );
  if (cellSelected) return cellSelected as HTMLElement;

  return null;
}

function getSelectedSidebarChatId(): string | null {
  const row = getSelectedSidebarRow();
  if (!row) return null;
  return findDataIdInTree(row);
}

function getSelectedSidebarDisplayName(): string {
  const row = getSelectedSidebarRow();
  if (!row) return '';

  const nameSelectors = ['span[title][dir="auto"]', 'span[title]'];
  for (const selector of nameSelectors) {
    const el = row.querySelector(selector);
    const title = el?.getAttribute('title')?.trim();
    const sanitizedTitle = sanitizeDisplayName(title);
    if (sanitizedTitle) return sanitizedTitle;
    const text = el?.textContent?.trim();
    const sanitizedText = sanitizeDisplayName(text);
    if (sanitizedText) return sanitizedText;
  }

  return '';
}

function isGroupDataId(dataId: string | null): boolean {
  if (!dataId) return false;
  return GROUP_OR_BROADCAST_SUFFIXES.some((s) => dataId.includes(s));
}

/** Contact from the selected row in the chat list (updates immediately on click). */
export function detectSelectedListContact(): DetectedContact | null {
  const row = getSelectedSidebarRow();
  if (!row) return null;

  const sidebarId = findDataIdInTree(row);
  if (isGroupDataId(sidebarId)) return null;

  const sidebarName = getSelectedSidebarDisplayName();

  if (sidebarId) {
    const phoneNumber = normalizeContactKey(sidebarId);
    if (isValidPhoneKey(phoneNumber)) {
      return {
        phoneNumber,
        displayName: sidebarName || formatDisplayFromKey(phoneNumber),
      };
    }
  }

  if (sidebarName) {
    return { phoneNumber: buildNameBasedKey(sidebarName), displayName: sidebarName };
  }

  return null;
}

/** True while WhatsApp is switching personal chats (sidebar id vs open chat id). */
export function isChatTransitioning(): boolean {
  if (!isChatOpen()) return false;

  const sidebarId = getSelectedSidebarChatId();
  const mainId = getMainPanelChatId();

  // Compare IDs only — name comparison caused permanent loading when list
  // focus differed from the open chat (groups, scroll, hover, etc.).
  if (sidebarId && mainId && !contactKeysMatch(sidebarId, mainId)) {
    return true;
  }

  return false;
}

function getMainPanelChatId(): string | null {
  const candidates = document.querySelectorAll('#main [data-id]');
  for (const el of candidates) {
    const id = el.getAttribute('data-id');
    if (id && isPersonalChatDataId(id)) return stripDataIdPrefix(id);
  }
  return null;
}

function getDisplayNameFromHeader(): string {
  for (const selector of CHAT_HEADER_SELECTORS) {
    const el = document.querySelector(selector);
    const title = el?.getAttribute('title')?.trim();
    const sanitizedTitle = sanitizeDisplayName(title);
    if (sanitizedTitle) return sanitizedTitle;
    const text = el?.textContent?.trim();
    const sanitizedText = sanitizeDisplayName(text);
    if (sanitizedText) return sanitizedText;
  }

  // Fallback: scan all spans/divs inside the chat header for a usable name.
  const header = document.querySelector('#main header');
  if (header) {
    const candidates = header.querySelectorAll('span[title], span[dir="auto"], div[role="button"] span');
    for (const el of candidates) {
      const title = el.getAttribute('title')?.trim();
      const sanitizedTitle = sanitizeDisplayName(title);
      if (sanitizedTitle) return sanitizedTitle;
      const text = el.textContent?.trim();
      const sanitizedText = sanitizeDisplayName(text);
      if (sanitizedText) return sanitizedText;
    }
  }

  return '';
}

function isChatOpen(): boolean {
  const main = document.querySelector('#main');
  if (!main || main.children.length === 0) return false;
  // A chat is open whenever the conversation header is present. We intentionally
  // do NOT require the message input, because its selectors change frequently
  // and may be missing (read-only/business views), which previously caused the
  // sidebar to keep showing "open a chat" while a chat was actually open.
  return Boolean(document.querySelector('#main header')) || Boolean(getChatHeaderElement());
}

/** True when a conversation panel looks open (not just the chat list). */
export function isWhatsAppChatOpen(): boolean {
  return isChatOpen();
}

export function detectCurrentContact(): DetectedContact | null {
  if (!isChatOpen()) return null;

  const headerName = getDisplayNameFromHeader();
  const mainId = getMainPanelChatId();
  const rawId = getHashChatId() ?? mainId;

  if (rawId) {
    const phoneNumber = normalizeContactKey(rawId);
    if (isValidPhoneKey(phoneNumber)) {
      return {
        phoneNumber,
        displayName: headerName || formatDisplayFromKey(phoneNumber),
      };
    }
  }

  if (headerName) {
    const phoneNumber = buildNameBasedKey(headerName);
    return { phoneNumber, displayName: headerName };
  }

  return null;
}

function formatDisplayFromKey(key: string): string {
  if (key.startsWith('name:')) return key.slice(5).replace(/-/g, ' ');
  if (key.includes('@')) {
    const [part] = key.split('@');
    if (/^\d+$/.test(part)) return `+${part}`;
    return part;
  }
  return key;
}

export function getMessageInput(): HTMLElement | null {
  for (const selector of MESSAGE_INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && isVisibleEditable(el)) return el;
  }

  // Broad fallback: any visible contenteditable in the conversation footer
  const footerEditables = document.querySelectorAll<HTMLElement>(
    '#main footer [contenteditable="true"], #main [data-testid="conversation-compose-box-input"]',
  );
  for (const el of footerEditables) {
    if (isVisibleEditable(el)) return el;
  }

  return null;
}

function isVisibleEditable(el: HTMLElement): boolean {
  if (el.getAttribute('contenteditable') !== 'true') return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getSearchInput(): HTMLElement | null {
  for (const selector of SEARCH_INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && isVisibleEditable(el)) return el;
  }
  return null;
}

function inputContainsText(input: HTMLElement, text: string): boolean {
  const sample = text.slice(0, Math.min(40, text.length)).trim();
  if (!sample) return true;
  const current = (input.innerText || input.textContent || '').replace(/\u200e|\u200f/g, '');
  return current.includes(sample);
}

function tryInsertViaExecCommand(input: HTMLElement, text: string): boolean {
  input.focus();

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(input);
    selection.addRange(range);
  }

  document.execCommand('selectAll', false);
  const ok = document.execCommand('insertText', false, text);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return ok || inputContainsText(input, text);
}

function tryInsertViaBeforeInput(input: HTMLElement, text: string): boolean {
  input.focus();
  try {
    input.dispatchEvent(
      new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    );
    if (!inputContainsText(input, text)) {
      input.textContent = text;
    }
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    return inputContainsText(input, text);
  } catch {
    return false;
  }
}

type InjectResultHandler = (ok: boolean) => void;
let injectResultHandler: InjectResultHandler | null = null;

/** Used by the DOM health monitor to learn about injection success/failure. */
export function setInjectResultHandler(handler: InjectResultHandler | null): void {
  injectResultHandler = handler;
}

export function injectTextToWhatsApp(text: string): boolean {
  const input = getMessageInput();
  if (!input) {
    injectResultHandler?.(false);
    return false;
  }

  const ok =
    (tryInsertViaExecCommand(input, text) || tryInsertViaBeforeInput(input, text)) &&
    inputContainsText(input, text);

  injectResultHandler?.(ok);
  return ok;
}

export interface ChatMessage {
  /**
   * 'me' = app user / business owner (outgoing WhatsApp message).
   * 'them' = customer / chat partner (incoming WhatsApp message).
   */
  role: 'me' | 'them';
  text: string;
}

function getMessageRow(el: HTMLElement): HTMLElement {
  return (
    (el.closest('[data-testid="msg-container"]') as HTMLElement | null) ||
    (el.closest('.message-out, .message-in') as HTMLElement | null) ||
    (el.closest('[data-id]') as HTMLElement | null) ||
    el
  );
}

/**
 * Detect who sent a WhatsApp bubble.
 * Prefer data-id / bubble class over nested querySelector (avoids me/them flips).
 */
function detectMessageRole(el: HTMLElement): 'me' | 'them' | null {
  const row = getMessageRow(el);
  const dataId =
    row.getAttribute('data-id') ||
    row.closest('[data-id]')?.getAttribute('data-id') ||
    '';

  // WhatsApp: true_… = outgoing (business user), false_… = incoming (customer)
  if (/(^|[^a-z])true_/i.test(dataId)) return 'me';
  if (/(^|[^a-z])false_/i.test(dataId)) return 'them';

  if (row.closest('.message-out') || /\bmessage-out\b/.test(row.className?.toString?.() ?? '')) {
    return 'me';
  }
  if (row.closest('.message-in') || /\bmessage-in\b/.test(row.className?.toString?.() ?? '')) {
    return 'them';
  }

  // Outgoing bubbles show delivery ticks
  if (
    row.querySelector(
      '[data-icon="msg-check"], [data-icon="msg-dblcheck"], [data-icon="msg-time"], [data-testid="msg-dblcheck"], [data-testid="msg-check"]',
    )
  ) {
    return 'me';
  }

  // data-pre-plain-text: "[10:30, 21/7/2026] You: " vs "[…] Contact Name: "
  const pre =
    row.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text') ??
    row.getAttribute('data-pre-plain-text') ??
    '';
  if (pre) {
    if (/\bYou:\s*$/i.test(pre) || /(?:^|\s)(?:אתה|את):\s*$/.test(pre)) return 'me';
    if (/\]\s+[^:\]]+:\s*$/.test(pre)) return 'them';
  }

  // Spatial: WA Web keeps "my" bubbles toward the end side of the pane
  const pane = document.querySelector('#main .copyable-area') || document.querySelector('#main');
  if (pane) {
    const paneRect = pane.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    if (rect.width > 0 && paneRect.width > 0) {
      const mid = paneRect.left + paneRect.width / 2;
      const bubbleMid = rect.left + rect.width / 2;
      if (bubbleMid > mid + 24) return 'me';
      if (bubbleMid < mid - 24) return 'them';
    }
  }

  return null;
}

function extractMessageText(el: HTMLElement): string {
  const textEl =
    el.querySelector<HTMLElement>('span.selectable-text.copyable-text') ||
    el.querySelector<HTMLElement>('span.selectable-text') ||
    el.querySelector<HTMLElement>('[data-testid="conversation-text"]') ||
    el.querySelector<HTMLElement>('.copyable-text span') ||
    el.querySelector<HTMLElement>('span[dir="auto"].selectable-text') ||
    el.querySelector<HTMLElement>('.copyable-text');

  let text = textEl?.innerText?.trim() || textEl?.textContent?.trim() || '';
  if (!text) {
    const copyable = el.querySelector<HTMLElement>('[data-pre-plain-text]');
    text = copyable?.innerText?.trim() || '';
  }
  return text.replace(/\u200e|\u200f/g, '').trim();
}

/** Reads recent text messages from the open WhatsApp chat (#main). */
export function readChatMessages(limit = 40): ChatMessage[] {
  const main = document.querySelector('#main');
  if (!main) return [];

  const candidates = main.querySelectorAll(
    '[data-testid="msg-container"], div.message-in, div.message-out, div[class*="message-in"], div[class*="message-out"], [data-id*="@"]',
  );

  const rows: HTMLElement[] = [];
  const seenRows = new Set<HTMLElement>();
  for (const node of Array.from(candidates)) {
    const row = getMessageRow(node as HTMLElement);
    if (seenRows.has(row)) continue;
    seenRows.add(row);
    rows.push(row);
  }

  const results: ChatMessage[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const role = detectMessageRole(row);
    if (!role) continue;

    const text = extractMessageText(row);
    if (!text || text.length < 1) continue;

    const key = `${role}:${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ role, text });
  }

  if (results.length === 0) {
    const fallbacks = main.querySelectorAll('div.copyable-text, span.selectable-text.copyable-text');
    for (const el of Array.from(fallbacks)) {
      const row = getMessageRow(el as HTMLElement);
      const role = detectMessageRole(row);
      if (!role) continue;
      const text = extractMessageText(row) || (el as HTMLElement).innerText?.trim();
      if (!text) continue;
      const key = `${role}:${text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ role, text });
    }
  }

  return results.slice(-limit);
}

export function openChatBySearch(query: string): boolean {
  const searchInput = getSearchInput();
  if (!searchInput) return false;

  searchInput.focus();
  searchInput.textContent = '';
  searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));

  document.execCommand('insertText', false, query);
  searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: query }));

  setTimeout(() => {
    const results = document.querySelectorAll('#pane-side [role="listitem"], #pane-side [data-id]');
    if (results.length > 0) {
      (results[0] as HTMLElement).click();
    }
  }, 800);

  return true;
}

export function openChatForContact(phoneNumber: string, displayName?: string): boolean {
  if (phoneNumber.startsWith('name:') && displayName) {
    return openChatBySearch(displayName);
  }
  const searchQuery = displayName || phoneNumber.replace(/@.*/, '').replace(/^\+/, '').replace(/^name:/, '');
  return openChatBySearch(searchQuery);
}

export function observeChatChanges(callback: (state: ChatDetectionState) => void): () => void {
  let lastReportedKey = '';
  let switchingSince = 0;
  const SWITCHING_MAX_MS = 12000;

  const check = () => {
    const contact = detectCurrentContact();
    const listContact = detectSelectedListContact();
    const mismatch =
      Boolean(listContact && contact && !contactsReferToSamePerson(listContact, contact));

    if (mismatch) {
      if (switchingSince === 0) switchingSince = Date.now();
    } else {
      switchingSince = 0;
    }

    const switching =
      mismatch && (switchingSince === 0 || Date.now() - switchingSince < SWITCHING_MAX_MS);

    const key = [
      contact?.phoneNumber ?? '',
      contact?.displayName ?? '',
      listContact?.phoneNumber ?? '',
      listContact?.displayName ?? '',
      switching ? '1' : '0',
    ].join('|');

    if (key !== lastReportedKey) {
      lastReportedKey = key;
      callback({ contact, listContact, switching });
    }
  };

  check();

  const observer = new MutationObserver(() => {
    check();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-id', 'aria-selected', 'title', 'tabindex'],
  });

  const paneSide = document.querySelector('#pane-side');
  const onPaneClick = () => {
    requestAnimationFrame(check);
  };
  paneSide?.addEventListener('click', onPaneClick, true);

  window.addEventListener('hashchange', check);
  window.addEventListener('popstate', check);
  const interval = setInterval(check, 200);

  return () => {
    observer.disconnect();
    paneSide?.removeEventListener('click', onPaneClick, true);
    window.removeEventListener('hashchange', check);
    window.removeEventListener('popstate', check);
    clearInterval(interval);
  };
}

export function adjustWhatsAppLayout(sidebarOpen: boolean, sidebarWidth = 350): void {
  const app = document.querySelector('#app') as HTMLElement | null;
  if (!app) return;

  app.style.paddingBottom = '';
  app.style.boxSizing = 'border-box';
  app.style.transition = 'margin-right 0.25s ease';

  if (sidebarOpen && sidebarWidth > 0) {
    app.style.marginRight = `${sidebarWidth}px`;
  } else {
    app.style.marginRight = '';
  }
}
