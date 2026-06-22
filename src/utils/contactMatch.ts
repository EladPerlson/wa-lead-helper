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

export function getPrimaryTagColor(tagIds: string[], tags: Tag[]): string | null {
  const primaryId = pickPrimaryTagId(tagIds);
  if (!primaryId) return null;
  return tags.find((t) => t.id === primaryId)?.color ?? null;
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

function primaryColorForContact(contact: ContactData, tagColorById: Map<string, string>): string | null {
  const primaryId = pickPrimaryTagId(contact.tags);
  if (!primaryId) return null;
  return tagColorById.get(primaryId) ?? null;
}

export function buildContactTagColorMap(
  contacts: Record<string, ContactData>,
  tags: Tag[],
): Map<string, string> {
  const tagColorById = new Map(tags.map((t) => [t.id, t.color]));
  const result = new Map<string, string>();

  for (const contact of Object.values(contacts)) {
    const color = primaryColorForContact(contact, tagColorById);
    if (!color) continue;

    for (const key of getContactLookupKeys(contact.phoneNumber)) {
      result.set(key, color);
    }
  }

  return result;
}

/** Maps a contact's display name -> primary tag color. Used to highlight chat-list rows,
 * which (in modern WhatsApp Web) do NOT expose a data-id, only the visible name. */
export function buildContactTagNameColorMap(
  contacts: Record<string, ContactData>,
  tags: Tag[],
): Map<string, string> {
  const tagColorById = new Map(tags.map((t) => [t.id, t.color]));
  const result = new Map<string, string>();

  for (const contact of Object.values(contacts)) {
    const color = primaryColorForContact(contact, tagColorById);
    if (!color) continue;

    const name = contact.displayName?.trim();
    if (name) {
      result.set(normalizeName(name), color);
    }

    if (contact.phoneNumber.startsWith('name:')) {
      const fromKey = contact.phoneNumber.slice(5).replace(/-/g, ' ').trim();
      if (fromKey) result.set(normalizeName(fromKey), color);
    }
  }

  return result;
}

export function findColorForName(name: string, nameColorMap: Map<string, string>): string | undefined {
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

export function findColorForChatId(dataId: string, colorMap: Map<string, string>): string | undefined {
  const keys = getContactLookupKeys(extractRawChatId(dataId));
  for (const key of keys) {
    const color = colorMap.get(key);
    if (color) return color;
  }
  return undefined;
}
