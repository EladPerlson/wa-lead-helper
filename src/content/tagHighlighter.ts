import { getAllStorage, initializeStorage, subscribeStorage } from '@/storage';
import {
  buildContactTagColorMap,
  buildContactTagNameColorMap,
  findColorForChatId,
  findColorForName,
  type TagHighlightInfo,
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

function formatBadgeText(info: TagHighlightInfo): string {
  return info.emoji ? `${info.emoji} ${info.label}` : info.label;
}

function clearHighlights(): void {
  document.querySelectorAll(`.${NAME_HIGHLIGHT_CLASS}`).forEach((el) => {
    const node = el as HTMLElement;
    node.classList.remove(NAME_HIGHLIGHT_CLASS);
    node.style.removeProperty('--wa-lh-tag-color');
    node.style.removeProperty('border-color');
    node.removeAttribute('data-wa-lh-tag');
    node.removeAttribute('data-wa-lh-tag-label');
  });
}

function applyNameHighlight(el: HTMLElement, info: TagHighlightInfo): void {
  const badgeText = formatBadgeText(info);
  const already =
    el.classList.contains(NAME_HIGHLIGHT_CLASS) &&
    el.getAttribute('data-wa-lh-tag') === info.color &&
    el.getAttribute('data-wa-lh-tag-label') === badgeText;

  if (already) return;

  el.classList.add(NAME_HIGHLIGHT_CLASS);
  el.style.setProperty('--wa-lh-tag-color', info.color);
  el.style.borderColor = info.color;
  el.setAttribute('data-wa-lh-tag', info.color);
  el.setAttribute('data-wa-lh-tag-label', badgeText);
}

function applyHighlights(
  idColorMap: Map<string, TagHighlightInfo>,
  nameColorMap: Map<string, TagHighlightInfo>,
): void {
  const pane = document.querySelector('#pane-side');
  if (!pane) return;

  const highlighted = new Set<HTMLElement>();

  pane.querySelectorAll('[data-id]').forEach((el) => {
    const dataId = el.getAttribute('data-id');
    if (!dataId || dataId.includes('@g.us') || dataId.includes('@newsletter')) return;

    const info = findColorForChatId(dataId, idColorMap);
    if (!info) return;

    const row = findChatRowElement(el);
    if (!row) return;

    const nameEl = findChatNameElement(row);
    if (nameEl) {
      applyNameHighlight(nameEl, info);
      highlighted.add(nameEl);
    }
  });

  pane.querySelectorAll('span[title]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (highlighted.has(htmlEl)) return;
    const title = htmlEl.getAttribute('title')?.trim();
    if (!title || !isValidDisplayName(title)) return;

    const info = findColorForName(title, nameColorMap);
    if (!info) return;

    applyNameHighlight(htmlEl, info);
    highlighted.add(htmlEl);
  });

  pane.querySelectorAll(`.${NAME_HIGHLIGHT_CLASS}`).forEach((el) => {
    if (!highlighted.has(el as HTMLElement)) {
      const node = el as HTMLElement;
      node.classList.remove(NAME_HIGHLIGHT_CLASS);
      node.style.removeProperty('--wa-lh-tag-color');
      node.style.removeProperty('border-color');
      node.removeAttribute('data-wa-lh-tag');
      node.removeAttribute('data-wa-lh-tag-label');
    }
  });
}

export function startTagHighlighter(): () => void {
  let applyTimer: ReturnType<typeof setTimeout> | null = null;
  let idColorMap: Map<string, TagHighlightInfo> = new Map();
  let nameColorMap: Map<string, TagHighlightInfo> = new Map();

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
