import { getAllContacts, getStorageItem, setStorageItem } from '@/storage';
import type { PlanLimits } from '@/plans';
import { isUnlimited } from '@/plans';
import type { Settings } from '@/types';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function countTaggedCustomers(): Promise<number> {
  const contacts = await getAllContacts();
  return contacts.filter((c) => c.tags.length > 0).length;
}

export async function canTagCustomer(
  limits: PlanLimits,
  contactPhone: string,
  newTags: string[],
): Promise<{ allowed: boolean; reason?: 'tagged_customers' }> {
  if (isUnlimited(limits.taggedCustomers)) return { allowed: true };
  if (newTags.length === 0) return { allowed: true };

  const contacts = await getAllContacts();
  const existing = contacts.find((c) => c.phoneNumber === contactPhone);
  const wasTagged = (existing?.tags.length ?? 0) > 0;
  if (wasTagged) return { allowed: true };

  const taggedCount = contacts.filter((c) => c.tags.length > 0).length;
  if (taggedCount >= limits.taggedCustomers) {
    return { allowed: false, reason: 'tagged_customers' };
  }
  return { allowed: true };
}

export async function canAddTemplate(
  limits: PlanLimits,
  currentCount: number,
): Promise<boolean> {
  if (isUnlimited(limits.templates)) return true;
  return currentCount < limits.templates;
}

export async function getReminderNotificationsToday(): Promise<number> {
  const settings = (await getStorageItem('settings')) ?? { darkMode: false };
  const date = settings.reminderNotificationsDate;
  if (date !== todayKey()) return 0;
  return settings.reminderNotificationsCount ?? 0;
}

export async function canShowReminderNotification(limits: PlanLimits): Promise<boolean> {
  if (isUnlimited(limits.remindersPerDay)) return true;
  const count = await getReminderNotificationsToday();
  return count < limits.remindersPerDay;
}

export async function recordReminderNotification(): Promise<void> {
  const settings: Settings = (await getStorageItem('settings')) ?? { darkMode: false };
  const today = todayKey();

  const count =
    settings.reminderNotificationsDate === today
      ? (settings.reminderNotificationsCount ?? 0) + 1
      : 1;

  await setStorageItem('settings', {
    ...settings,
    reminderNotificationsDate: today,
    reminderNotificationsCount: count,
  });
}
