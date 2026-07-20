import { describe, expect, it } from 'vitest';
import {
  buildNameBasedKey,
  contactKeysMatch,
  formatPhoneDisplay,
  isValidPhoneKey,
  normalizeContactKey,
  parsePhoneFromChatId,
} from '@/utils/phone';

describe('normalizeContactKey', () => {
  it('normalizes c.us chat ids', () => {
    expect(normalizeContactKey('972501234567@c.us')).toBe('972501234567@c.us');
  });

  it('strips true_/false_ prefixes', () => {
    expect(normalizeContactKey('true_972501234567@c.us')).toBe('972501234567@c.us');
  });

  it('normalizes raw plus phones', () => {
    expect(normalizeContactKey('+972501234567')).toBe('+972501234567');
  });

  it('keeps name-based keys', () => {
    expect(normalizeContactKey('name:גילגול-שלי')).toBe('name:גילגול-שלי');
  });
});

describe('contactKeysMatch', () => {
  it('matches identical normalized keys', () => {
    expect(contactKeysMatch('972501234567@c.us', 'true_972501234567@c.us')).toBe(true);
  });

  it('rejects different numbers', () => {
    expect(contactKeysMatch('972501234567@c.us', '972509999999@c.us')).toBe(false);
  });
});

describe('formatPhoneDisplay', () => {
  it('formats Israeli numbers', () => {
    expect(formatPhoneDisplay('972501234567@c.us')).toMatch(/972/);
  });

  it('formats name keys as readable text', () => {
    expect(formatPhoneDisplay('name:gilgol-shli')).toBe('gilgol shli');
  });
});

describe('parsePhoneFromChatId / helpers', () => {
  it('parses chat id via normalize', () => {
    expect(parsePhoneFromChatId('972501234567@c.us')).toBe('972501234567@c.us');
  });

  it('builds name based keys', () => {
    expect(buildNameBasedKey('גילגול שלי')).toMatch(/^name:/);
  });

  it('validates keys', () => {
    expect(isValidPhoneKey('unknown-chat')).toBe(false);
    expect(isValidPhoneKey('972501234567@c.us')).toBe(true);
    expect(isValidPhoneKey('name:x')).toBe(true);
  });
});
