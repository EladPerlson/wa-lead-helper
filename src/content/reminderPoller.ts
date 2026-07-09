import { getPlanLimits, normalizePlanId } from '@/plans';
import { getAllReminders, getStorageItem } from '@/storage';
import { canShowReminderNotification, recordReminderNotification } from '@/utils/limits';
import { isReminderDue } from '@/utils/date';
import { handleChromeError } from '@/utils/extensionContext';

const POLL_INTERVAL_MS = 30_000;

async function getCachedLimits() {
  const settings = (await getStorageItem('settings')) ?? { darkMode: false };
  const plan = normalizePlanId(settings.cachedPlan);
  return getPlanLimits(plan);
}

export function startReminderPoller(onDue: (reminderId: string) => void): () => void {
  const shownIds = new Set<string>();

  const check = async () => {
    try {
      const limits = await getCachedLimits();
      const reminders = await getAllReminders();
      for (const reminder of reminders) {
        if (isReminderDue(reminder) && !shownIds.has(reminder.id)) {
          if (!(await canShowReminderNotification(limits))) {
            continue;
          }
          shownIds.add(reminder.id);
          await recordReminderNotification();
          onDue(reminder.id);
        }
      }
    } catch (error) {
      handleChromeError(error);
    }
  };

  void check();

  const intervalId = setInterval(() => {
    void check();
  }, POLL_INTERVAL_MS);

  const onStorageChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local') return;
    if (changes.contacts || changes.settings) void check();
  };

  try {
    chrome.storage.onChanged.addListener(onStorageChanged);
  } catch (error) {
    handleChromeError(error);
  }

  return () => {
    clearInterval(intervalId);
    try {
      chrome.storage.onChanged.removeListener(onStorageChanged);
    } catch {
      // extension context gone
    }
  };
}
