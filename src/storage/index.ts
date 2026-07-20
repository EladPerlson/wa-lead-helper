import type { ContactData, Reminder, Settings, StorageSchema, Tag, Template } from '@/types';
import {
  handleChromeError,
  isContextInvalidated,
  safeStorageClear,
  safeStorageGet,
  safeStorageSet,
} from '@/utils/extensionContext';
import { contactKeysMatch } from '@/utils/phone';

export const STORAGE_KEYS = {
  contacts: 'contacts',
  tags: 'tags',
  templates: 'templates',
  settings: 'settings',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  showChatAiOffer: true,
};

export const DEFAULT_TAGS: Tag[] = [
  { id: 'hot-lead', label: 'ליד חם', color: '#ef4444', emoji: '🔥' },
  { id: 'follow-up', label: 'צריך מעקב', color: '#f59e0b', emoji: '📞' },
  { id: 'active-client', label: 'לקוח פעיל', color: '#22c55e', emoji: '✅' },
  { id: 'deal-closed', label: 'עסקה נסגרה', color: '#3b82f6', emoji: '💰' },
  { id: 'not-relevant', label: 'לא רלוונטי', color: '#6b7280', emoji: '❌' },
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    text: 'שלום, תודה שפנית אלינו.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    text: 'אבדוק ואחזור אליך בהקדם.',
    createdAt: new Date().toISOString(),
  },
];

async function storageGet(keys: string | string[]): Promise<Record<string, unknown>> {
  if (isContextInvalidated()) return {};
  const result = await safeStorageGet(keys);
  if (Object.keys(result).length === 0 && isContextInvalidated()) return {};
  return result;
}

async function storageSet(items: Record<string, unknown>): Promise<void> {
  if (isContextInvalidated()) return;
  const ok = await safeStorageSet(items);
  if (!ok && isContextInvalidated()) return;
}

export async function getStorageItem<K extends keyof StorageSchema>(
  key: K,
): Promise<StorageSchema[K]> {
  const result = await storageGet(key);
  return result[key] as StorageSchema[K];
}

export async function setStorageItem<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  await storageSet({ [key]: value });
}

export async function getAllStorage(): Promise<StorageSchema> {
  const result = await storageGet(Object.values(STORAGE_KEYS));
  return {
    contacts: (result.contacts as Record<string, ContactData>) ?? {},
    tags: (result.tags as Tag[]) ?? DEFAULT_TAGS,
    templates: (result.templates as Template[]) ?? DEFAULT_TEMPLATES,
    settings: (result.settings as Settings) ?? DEFAULT_SETTINGS,
  };
}

export async function initializeStorage(): Promise<void> {
  const existing = await storageGet(Object.values(STORAGE_KEYS));

  const updates: Partial<Record<keyof StorageSchema, StorageSchema[keyof StorageSchema]>> = {};

  if (!existing.tags) {
    updates.tags = DEFAULT_TAGS;
  }
  if (!existing.templates) {
    updates.templates = DEFAULT_TEMPLATES;
  }
  if (!existing.contacts) {
    updates.contacts = {};
  }
  if (!existing.settings) {
    updates.settings = DEFAULT_SETTINGS;
  }

  if (Object.keys(updates).length > 0) {
    await storageSet(updates);
  }
}

export function subscribeStorage(
  callback: (changes: Partial<StorageSchema>, area: string) => void,
): () => void {
  if (isContextInvalidated()) return () => {};

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area !== 'local') return;

    const parsed: Partial<StorageSchema> = {};
    for (const key of Object.keys(changes)) {
      if (key in STORAGE_KEYS) {
        (parsed as Record<string, unknown>)[key] = changes[key].newValue;
      }
    }
    callback(parsed, area);
  };

  try {
    chrome.storage.onChanged.addListener(listener);
  } catch (error) {
    handleChromeError(error);
    return () => {};
  }

  return () => {
    try {
      chrome.storage.onChanged.removeListener(listener);
    } catch {
      // context already gone
    }
  };
}

export async function getContact(phoneNumber: string): Promise<ContactData | null> {
  const contacts = (await getStorageItem('contacts')) ?? {};
  if (contacts[phoneNumber]) return contacts[phoneNumber];

  for (const contact of Object.values(contacts)) {
    if (contactKeysMatch(contact.phoneNumber, phoneNumber)) {
      return contact;
    }
  }

  return null;
}

export async function saveContact(contact: ContactData): Promise<void> {
  const contacts = (await getStorageItem('contacts')) ?? {};
  contacts[contact.phoneNumber] = contact;
  await setStorageItem('contacts', contacts);
}

export async function createEmptyContact(
  phoneNumber: string,
  displayName?: string,
): Promise<ContactData> {
  const existing = await getContact(phoneNumber);
  if (existing) return existing;

  const contact: ContactData = {
    phoneNumber,
    displayName,
    notes: '',
    tags: [],
    status: 'new',
    createdAt: new Date().toISOString(),
    reminders: [],
    templatesUsed: 0,
  };

  await saveContact(contact);
  return contact;
}

export async function updateContact(
  phoneNumber: string,
  updates: Partial<Omit<ContactData, 'phoneNumber'>>,
): Promise<ContactData> {
  const contact = (await getContact(phoneNumber)) ?? (await createEmptyContact(phoneNumber));
  const updated = { ...contact, ...updates, phoneNumber };
  await saveContact(updated);
  return updated;
}

export async function getAllReminders(): Promise<Reminder[]> {
  const contacts = (await getStorageItem('contacts')) ?? {};
  return Object.values(contacts).flatMap((c) => c.reminders);
}

export async function getAllContacts(): Promise<ContactData[]> {
  const contacts = (await getStorageItem('contacts')) ?? {};
  return Object.values(contacts).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function findReminderById(reminderId: string): Promise<{ reminder: Reminder; contact: ContactData } | null> {
  const contacts = (await getStorageItem('contacts')) ?? {};
  for (const contact of Object.values(contacts)) {
    const reminder = contact.reminders.find((r) => r.id === reminderId);
    if (reminder) return { reminder, contact };
  }
  return null;
}

export async function markReminderComplete(reminderId: string): Promise<void> {
  const found = await findReminderById(reminderId);
  if (!found) return;

  const { reminder, contact } = found;
  await updateContact(contact.phoneNumber, {
    reminders: contact.reminders.map((r) =>
      r.id === reminder.id ? { ...r, completed: true } : r,
    ),
  });
}

export async function exportData(): Promise<string> {
  const data = await getAllStorage();
  const exportPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const parsed = JSON.parse(jsonString) as {
    data?: StorageSchema;
    contacts?: Record<string, ContactData>;
    tags?: Tag[];
    templates?: Template[];
    settings?: Settings;
  };

  const incoming = parsed.data ?? {
    contacts: parsed.contacts ?? {},
    tags: parsed.tags ?? DEFAULT_TAGS,
    templates: parsed.templates ?? DEFAULT_TEMPLATES,
    settings: parsed.settings ?? DEFAULT_SETTINGS,
  };

  const current = await getAllStorage();

  const mergedContacts = { ...current.contacts, ...incoming.contacts };
  const mergedTags = mergeTags(current.tags, incoming.tags);
  const mergedTemplates = mergeTemplates(current.templates, incoming.templates);

  await storageSet({
    contacts: mergedContacts,
    tags: mergedTags,
    templates: mergedTemplates,
    settings: { ...current.settings, ...incoming.settings },
  });
}

function mergeTags(current: Tag[], incoming: Tag[]): Tag[] {
  const map = new Map(current.map((t) => [t.id, t]));
  for (const tag of incoming) {
    map.set(tag.id, tag);
  }
  return Array.from(map.values());
}

function mergeTemplates(current: Template[], incoming: Template[]): Template[] {
  const map = new Map(current.map((t) => [t.id, t]));
  for (const tpl of incoming) {
    map.set(tpl.id, tpl);
  }
  return Array.from(map.values());
}

export async function clearAllData(): Promise<void> {
  await safeStorageClear();
  await initializeStorage();
}

export async function getContactsCount(): Promise<number> {
  const contacts = (await getStorageItem('contacts')) ?? {};
  return Object.keys(contacts).length;
}
