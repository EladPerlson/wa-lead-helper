import { describe, expect, it } from 'vitest';
import {
  contactsReferToSamePerson,
  extractRawChatId,
  getContactLookupKeys,
  normalizeName,
  pickPrimaryTagId,
} from '@/utils/contactMatch';

describe('normalizeName', () => {
  it('strips emojis and punctuation', () => {
    expect(normalizeName('גילגול שלי💙🤍')).toBe('גילגול שלי');
  });

  it('lowercases latin names', () => {
    expect(normalizeName('John Doe!')).toBe('john doe');
  });
});

describe('getContactLookupKeys', () => {
  it('expands digit variants for a chat id', () => {
    const keys = getContactLookupKeys('972501234567@c.us');
    expect(keys).toContain('972501234567@c.us');
    expect(keys).toContain('972501234567');
    expect(keys).toContain('+972501234567');
  });

  it('returns only name key for name-based contacts', () => {
    const keys = getContactLookupKeys('name:foo-bar');
    expect(keys).toEqual(['name:foo-bar']);
  });
});

describe('pickPrimaryTagId', () => {
  it('prefers hot-lead over others', () => {
    expect(pickPrimaryTagId(['active-client', 'hot-lead', 'follow-up'])).toBe('hot-lead');
  });

  it('returns null for empty', () => {
    expect(pickPrimaryTagId([])).toBeNull();
  });
});

describe('contactsReferToSamePerson', () => {
  it('matches by phone key', () => {
    expect(
      contactsReferToSamePerson(
        { phoneNumber: '972501234567@c.us', displayName: 'A' },
        { phoneNumber: 'true_972501234567@c.us', displayName: 'B' },
      ),
    ).toBe(true);
  });

  it('matches by normalized display name', () => {
    expect(
      contactsReferToSamePerson(
        { phoneNumber: 'name:a', displayName: 'דני כהן🔥' },
        { phoneNumber: 'name:b', displayName: 'דני כהן' },
      ),
    ).toBe(true);
  });
});

describe('extractRawChatId', () => {
  it('strips boolean prefixes', () => {
    expect(extractRawChatId('false_972501234567@c.us')).toBe('972501234567@c.us');
  });
});
