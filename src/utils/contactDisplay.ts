import type { ContactData } from '@/types';
import { formatPhoneDisplay } from './phone';

const INVALID_NAME_PATTERNS = [
  /^נראה\/נראתה/i,
  /^נראה\/תה/i,
  /^last seen/i,
  /^online$/i,
  /^הקלדה/i,
  /^typing/i,
  /^recording/i,
  /^מקליט/i,
  /^[0-9A-F]{12,}$/i,
  /^3EB[0-9A-F]+$/i,
  /^\+?\d{15,}$/,
  /^message$/i,
  /^הודעה/i,
];

export function isValidDisplayName(name: string | undefined | null): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;

  for (const pattern of INVALID_NAME_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  if (/^\d+$/.test(trimmed.replace(/\s/g, ''))) return false;

  return true;
}

export function sanitizeDisplayName(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  return isValidDisplayName(trimmed) ? trimmed : undefined;
}

export function isStorableContactKey(key: string): boolean {
  if (!key || key === 'unknown-chat') return false;
  if (/^3EB[0-9A-F]+$/i.test(key)) return false;
  if (/^[0-9A-F]{18,}$/i.test(key.replace(/[@.+]/g, ''))) return false;
  return key.length > 0;
}

export function getContactLabel(contact: ContactData): string {
  if (isValidDisplayName(contact.displayName)) {
    return contact.displayName!.trim();
  }
  return formatPhoneDisplay(contact.phoneNumber);
}

export function getContactPhoneSubtitle(contact: ContactData): string | null {
  const phone = formatPhoneDisplay(contact.phoneNumber);
  const label = getContactLabel(contact);

  if (phone.startsWith('name:') || phone === label) return null;
  if (!phone || phone === label) return null;

  return phone;
}

export function shouldShowInContactList(contact: ContactData): boolean {
  if (!isStorableContactKey(contact.phoneNumber)) return false;

  const hasData =
    Boolean(contact.notes?.trim()) ||
    contact.tags.length > 0 ||
    contact.reminders.length > 0 ||
    contact.templatesUsed > 0;

  const hasValidName = isValidDisplayName(contact.displayName);
  const hasPhone =
    contact.phoneNumber.includes('@c.us') ||
    contact.phoneNumber.includes('@lid') ||
    /^\+?\d{9,15}$/.test(contact.phoneNumber.replace(/\D/g, ''));

  return hasData || hasValidName || hasPhone;
}

export function getDetectedContactLabel(
  phoneNumber: string,
  displayName?: string,
): { label: string; subtitle: string | null } {
  const contact: ContactData = {
    phoneNumber,
    displayName,
    notes: '',
    tags: [],
    createdAt: '',
    reminders: [],
    templatesUsed: 0,
  };
  return {
    label: getContactLabel(contact),
    subtitle: getContactPhoneSubtitle(contact),
  };
}

export function pickDisplayNameForSave(
  incoming: string | undefined,
  existing: string | undefined,
): string | undefined {
  const sanitizedIncoming = sanitizeDisplayName(incoming);
  if (sanitizedIncoming) return sanitizedIncoming;
  return sanitizeDisplayName(existing);
}
