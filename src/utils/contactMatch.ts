import type { ContactData, DetectedContact, Tag } from '@/types';
import { contactKeysMatch, normalizeContactKey } from './phone';

const TAG_PRIORITY = ['hot-lead', 'follow-up', 'active-client', 'deal-closed', 'not-relevant'];

export function getContactLookupKeys(phoneNumber: string): string[] {
  const normalized = normalizeContactKey(phoneNumber);
  const keys = new Set<string>([normalized]);

  if (normalized.startsWith('name:')) {
    return Array.from(keys);
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits) {
    keys.add(digits);
    keys.add(`+${digits}`);
    keys.add(`${digits}@c.us`);
    keys.add(`${digits}@g.us`);
    keys.add(`${digits}@s.whatsapp.net`);
    keys.add(`${digits}@lid`);
  }

  return Array.from(keys);
}

export function extractRawChatId(dataId: string): string {
  const cleaned = dataId.replace(/^(true|false)_/i, '');
  return normalizeContactKey(cleaned);
}

export function pickPrimaryTagId(tagIds: string[]): string | null {
  if (tagIds.length === 0) return null;
  for (const id of TAG_PRIORITY) {
    if (tagIds.includes(id)) return id;
  }
  return tagIds[0];
}

export interface TagHighlightInfo {
  color: string;
  label: string;
  emoji?: string;
}

export function getPrimaryTagColor(tagIds: string[], tags: Tag[]): string | null {
  return getPrimaryTagInfo(tagIds, tags)?.color ?? null;
}

export function getPrimaryTagInfo(tagIds: string[], tags: Tag[]): TagHighlightInfo | null {
  const primaryId = pickPrimaryTagId(tagIds);
  if (!primaryId) return null;
  const tag = tags.find((t) => t.id === primaryId);
  if (!tag?.color) return null;
  return {
    color: tag.color,
    label: tag.label,
    emoji: tag.emoji,
  };
}

/** Strong name normalization: removes emojis/punctuation so names like
 * "גילגול שלי💙🤍" match the saved "גילגול שלי". */
export function normalizeName(name: string): string {
  return name
    .normalize('NFKC')
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

function primaryInfoForContact(
  contact: ContactData,
  tagById: Map<string, Tag>,
): TagHighlightInfo | null {
  const primaryId = pickPrimaryTagId(contact.tags);
  if (!primaryId) return null;
  const tag = tagById.get(primaryId);
  if (!tag?.color) return null;
  return { color: tag.color, label: tag.label, emoji: tag.emoji };
}

export function buildContactTagColorMap(
  contacts: Record<string, ContactData>,
  tags: Tag[],
): Map<string, TagHighlightInfo> {
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const result = new Map<string, TagHighlightInfo>();

  for (const contact of Object.values(contacts)) {
    const info = primaryInfoForContact(contact, tagById);
    if (!info) continue;

    for (const key of getContactLookupKeys(contact.phoneNumber)) {
      result.set(key, info);
    }
  }

  return result;
}

/** Maps a contact's display name -> primary tag info. Used to highlight chat-list rows,
 * which (in modern WhatsApp Web) do NOT expose a data-id, only the visible name. */
export function buildContactTagNameColorMap(
  contacts: Record<string, ContactData>,
  tags: Tag[],
): Map<string, TagHighlightInfo> {
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const result = new Map<string, TagHighlightInfo>();

  for (const contact of Object.values(contacts)) {
    const info = primaryInfoForContact(contact, tagById);
    if (!info) continue;

    const name = contact.displayName?.trim();
    if (name) {
      result.set(normalizeName(name), info);
    }

    if (contact.phoneNumber.startsWith('name:')) {
      const fromKey = contact.phoneNumber.slice(5).replace(/-/g, ' ').trim();
      if (fromKey) result.set(normalizeName(fromKey), info);
    }
  }

  return result;
}

export function findColorForName(
  name: string,
  nameColorMap: Map<string, TagHighlightInfo>,
): TagHighlightInfo | undefined {
  return nameColorMap.get(normalizeName(name));
}

export function contactsReferToSamePerson(
  a: Pick<DetectedContact, 'phoneNumber' | 'displayName'> | null | undefined,
  b: Pick<DetectedContact, 'phoneNumber' | 'displayName'> | null | undefined,
): boolean {
  if (!a || !b) return false;
  if (contactKeysMatch(a.phoneNumber, b.phoneNumber)) return true;
  if (a.displayName && b.displayName) {
    return normalizeName(a.displayName) === normalizeName(b.displayName);
  }
  return false;
}

export function findColorForChatId(
  dataId: string,
  colorMap: Map<string, TagHighlightInfo>,
): TagHighlightInfo | undefined {
  const keys = getContactLookupKeys(extractRawChatId(dataId));
  for (const key of keys) {
    const info = colorMap.get(key);
    if (info) return info;
  }
  return undefined;
}
