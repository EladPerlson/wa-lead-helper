import { getAllStorage, initializeStorage, subscribeStorage } from '@/storage';
import {
  buildContactTagColorMap,
  buildContactTagNameColorMap,
  findColorForChatId,
  findColorForName,
} from '@/utils/contactMatch';
import { isContextInvalidated } from '@/utils/extensionContext';
import { isValidDisplayName } from '@/utils/contactDisplay';

const NAME_HIGHLIGHT_CLASS = 'wa-lh-tag-name-highlight';
const DEBOUNCE_MS = 150;

function findChatRowElement(el: Element): HTMLElement | null {
  let current: Element | null = el;

  while (current && current !== document.body) {
    const role = current.getAttribute('role');
    const testId = current.getAttribute('data-testid');
    if (role === 'listitem' || testId === 'cell-frame-container' || testId === 'list-item') {
      return current as HTMLElement;
    }
    current = current.parentElement;
  }

  return (el.closest('[role="row"]') as HTMLElement) ?? (el.parentElement as HTMLElement);
}

function findChatNameElement(row: HTMLElement): HTMLElement | null {
  const selectors = [
    'span[title][dir="auto"]',
    'span[title]',
    '[data-testid="conversation-info"] span',
    'div[role="gridcell"] span[title]',
  ];

  for (const selector of selectors) {
    const candidates = row.querySelectorAll(selector);
    for (const el of candidates) {
      const title = el.getAttribute('title')?.trim();
      const text = el.textContent?.trim();
      const name = title || text;
      if (name && isValidDisplayName(name)) {
        return el as HTMLElement;
      }
    }
  }

  return row.querySelector('span[title]') as HTMLElement | null;
}

function clearHighlights(): void {
  document.querySelectorAll(`.${NAME_HIGHLIGHT_CLASS}`).forEach((el) => {
    const node = el as HTMLElement;
    node.classList.remove(NAME_HIGHLIGHT_CLASS);
    node.style.removeProperty('--wa-lh-tag-color');
    node.style.removeProperty('border-color');
    node.removeAttribute('data-wa-lh-tag');
  });
}

function applyNameHighlight(el: HTMLElement, color: string): void {
  el.classList.add(NAME_HIGHLIGHT_CLASS);
  el.style.setProperty('--wa-lh-tag-color', color);
  el.style.borderColor = color;
  el.setAttribute('data-wa-lh-tag', color);
}

function applyHighlights(idColorMap: Map<string, string>, nameColorMap: Map<string, string>): void {
  clearHighlights();

  const pane = document.querySelector('#pane-side');
  if (!pane) return;

  pane.querySelectorAll('[data-id]').forEach((el) => {
    const dataId = el.getAttribute('data-id');
    if (!dataId || dataId.includes('@g.us') || dataId.includes('@newsletter')) return;

    const color = findColorForChatId(dataId, idColorMap);
    if (!color) return;

    const row = findChatRowElement(el);
    if (!row) return;

    const nameEl = findChatNameElement(row);
    if (nameEl) {
      applyNameHighlight(nameEl, color);
    }
  });

  pane.querySelectorAll('span[title]').forEach((el) => {
    if (el.classList.contains(NAME_HIGHLIGHT_CLASS)) return;
    const title = el.getAttribute('title')?.trim();
    if (!title || !isValidDisplayName(title)) return;

    const color = findColorForName(title, nameColorMap);
    if (!color) return;

    applyNameHighlight(el as HTMLElement, color);
  });
}

export function startTagHighlighter(): () => void {
  let applyTimer: ReturnType<typeof setTimeout> | null = null;
  let idColorMap: Map<string, string> = new Map();
  let nameColorMap: Map<string, string> = new Map();

  const reloadColorMap = async () => {
    if (isContextInvalidated()) return;
    const { contacts, tags } = await getAllStorage();
    idColorMap = buildContactTagColorMap(contacts, tags);
    nameColorMap = buildContactTagNameColorMap(contacts, tags);
    applyHighlights(idColorMap, nameColorMap);
  };

  const scheduleApply = () => {
    if (isContextInvalidated()) return;
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyHighlights(idColorMap, nameColorMap);
    }, DEBOUNCE_MS);
  };

  initializeStorage().then(() => reloadColorMap());

  const unsubStorage = subscribeStorage((changes) => {
    if (changes.contacts || changes.tags) {
      reloadColorMap();
    }
  });

  const observer = new MutationObserver(() => scheduleApply());
  const paneSide = document.querySelector('#pane-side');
  if (paneSide) {
    observer.observe(paneSide, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-id', 'aria-selected', 'title'],
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  const interval = setInterval(() => applyHighlights(idColorMap, nameColorMap), 2000);

  return () => {
    unsubStorage();
    observer.disconnect();
    clearInterval(interval);
    if (applyTimer) clearTimeout(applyTimer);
    clearHighlights();
  };
}
