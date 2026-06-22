import type { DetectedContact, ChatDetectionState } from '@/types';
import { normalizeContactKey, isValidPhoneKey, buildNameBasedKey, contactKeysMatch } from './phone';
import { sanitizeDisplayName } from './contactDisplay';
import { contactsReferToSamePerson } from './contactMatch';

const CHAT_HEADER_SELECTORS = [
  '#main header [data-testid="conversation-info-header"] span[title]',
  '#main header [data-testid="conversation-info-header-chat-title"] span',
  '#main header span[title][dir="auto"]',
  '#main header span[title]',
  '#main header div[role="button"] span[title]',
];

const MESSAGE_INPUT_SELECTORS = [
  '#main footer div[contenteditable="true"][data-tab="10"]',
  '#main footer div[contenteditable="true"][role="textbox"]',
  '#main footer div[contenteditable="true"]',
  'div[contenteditable="true"][data-tab="10"]',
];

const SEARCH_INPUT_SELECTORS = [
  '#side div[contenteditable="true"][data-tab="3"]',
  'div[contenteditable="true"][data-tab="3"]',
];

const GROUP_OR_BROADCAST_SUFFIXES = ['@g.us', '@newsletter', '@broadcast'];

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
  return Boolean(document.querySelector('#main header'));
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
    if (el) return el;
  }
  return null;
}

function getSearchInput(): HTMLElement | null {
  for (const selector of SEARCH_INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

export function injectTextToWhatsApp(text: string): boolean {
  const input = getMessageInput();
  if (!input) return false;

  input.focus();

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(input);
    selection.addRange(range);
  }

  document.execCommand('selectAll', false);
  document.execCommand('insertText', false, text);

  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  return true;
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

  if (sidebarOpen) {
    app.style.marginRight = `${sidebarWidth}px`;
    app.style.transition = 'margin-right 0.25s ease';
  } else {
    app.style.marginRight = '';
  }
}
