export function parsePhoneFromChatId(chatId: string): string {
  if (!chatId) return '';
  return normalizeContactKey(chatId);
}

/** Stable storage key from WhatsApp chat id (e.g. 972501234567@c.us) */
export function normalizeContactKey(chatId: string): string {
  if (!chatId) return '';

  const cleaned = chatId.trim().replace(/^(true|false)_/i, '');

  if (cleaned.startsWith('name:')) return cleaned;

  if (cleaned.includes('@')) {
    const [userPart, domain] = cleaned.split('@');
    if (/^\d+$/.test(userPart)) {
      const normalized = userPart.startsWith('+') ? userPart.slice(1) : userPart;
      return `${normalized}@${domain}`;
    }
    return `${userPart}@${domain}`;
  }

  if (/^\+?\d+$/.test(cleaned.replace(/\s/g, ''))) {
    const digits = cleaned.replace(/\D/g, '');
    return `+${digits}`;
  }

  return cleaned;
}

export function buildNameBasedKey(displayName: string): string {
  const slug = displayName
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `name:${slug || 'contact'}`;
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';

  if (phone.startsWith('name:')) {
    return phone.slice(5).replace(/-/g, ' ');
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972') && digits.length >= 11) {
    return `+${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  if (digits.length >= 10) {
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  if (phone.includes('@lid')) return phone.split('@')[0];

  return phone;
}

export function isValidPhoneKey(key: string): boolean {
  if (!key || key === 'unknown-chat') return false;
  if (key.startsWith('name:')) return key.length > 5;
  return key.length > 0;
}

export function contactKeysMatch(a: string, b: string): boolean {
  return normalizeContactKey(a) === normalizeContactKey(b);
}
