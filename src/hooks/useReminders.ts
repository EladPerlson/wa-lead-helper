import { useCallback } from 'react';
import type { Reminder } from '@/types';
import type { MessageType } from '@/types';
import { safeRuntimeSendMessage } from '@/utils/extensionContext';

export function useReminders() {
  const scheduleReminder = useCallback(async (reminder: Reminder) => {
    const message: MessageType = { type: 'SCHEDULE_REMINDER', reminder };
    await safeRuntimeSendMessage(message);
  }, []);

  const cancelReminder = useCallback(async (reminderId: string) => {
    const message: MessageType = { type: 'CANCEL_REMINDER', reminderId };
    await safeRuntimeSendMessage(message);
  }, []);

  const rescheduleAll = useCallback(async (reminders: Reminder[]) => {
    const message: MessageType = { type: 'RESCHEDULE_ALL_REMINDERS', reminders };
    await safeRuntimeSendMessage(message);
  }, []);

  return { scheduleReminder, cancelReminder, rescheduleAll };
}
