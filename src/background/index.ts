import type { MessageType, Reminder } from '@/types';
import { getAllReminders, initializeStorage } from '@/storage';
import { getReminderTimestamp } from '@/utils/date';

const WHATSAPP_URL = 'https://web.whatsapp.com/';

initializeStorage();

chrome.runtime.onInstalled.addListener(() => {
  rescheduleAllReminders();
});

chrome.runtime.onStartup.addListener(() => {
  rescheduleAllReminders();
});

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message)
    .then(() => sendResponse({ success: true }))
    .catch((err) => sendResponse({ success: false, error: String(err) }));
  return true;
});

async function handleMessage(message: MessageType): Promise<void> {
  switch (message.type) {
    case 'SCHEDULE_REMINDER':
      await scheduleReminderAlarm(message.reminder);
      break;
    case 'CANCEL_REMINDER':
      await chrome.alarms.clear(message.reminderId);
      break;
    case 'RESCHEDULE_ALL_REMINDERS':
      await rescheduleReminders(message.reminders);
      break;
    case 'OPEN_REMINDER_POPUP':
    case 'SHOW_REMINDER_OVERLAY':
      await showReminderFullScreen(message.reminderId);
      break;
    case 'OPEN_WHATSAPP':
      await openWhatsApp();
      break;
  }
}

async function scheduleReminderAlarm(reminder: Reminder): Promise<void> {
  const when = getReminderTimestamp(reminder.date, reminder.time);
  if (when <= Date.now()) return;
  await chrome.alarms.create(reminder.id, { when });
}

async function rescheduleReminders(reminders: Reminder[]): Promise<void> {
  const allAlarms = await chrome.alarms.getAll();
  for (const alarm of allAlarms) {
    if (alarm.name.startsWith('rem-')) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  for (const reminder of reminders) {
    if (!reminder.completed) {
      await scheduleReminderAlarm(reminder);
    }
  }
}

async function rescheduleAllReminders(): Promise<void> {
  const reminders = await getAllReminders();
  await rescheduleReminders(reminders.filter((r) => !r.completed));
}

async function showReminderFullScreen(reminderId: string): Promise<void> {
  const whatsappTabs = await chrome.tabs.query({ url: `${WHATSAPP_URL}*` });

  if (whatsappTabs.length > 0) {
    let shown = false;

    for (const tab of whatsappTabs) {
      if (!tab.id) continue;
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_REMINDER_OVERLAY',
          reminderId,
        } satisfies MessageType);
        shown = true;
      } catch {
        // content script not ready on this tab
      }
    }

    const activeTab = whatsappTabs.find((t) => t.active) ?? whatsappTabs[0];
    if (activeTab?.windowId) {
      await chrome.windows.update(activeTab.windowId, { focused: true });
    }
    if (activeTab?.id) {
      await chrome.tabs.update(activeTab.id, { active: true });
    }

    if (shown) return;
  }

  await openReminderFullscreenWindow(reminderId);
}

async function openReminderFullscreenWindow(reminderId: string): Promise<void> {
  const url = chrome.runtime.getURL(`reminder.html?id=${encodeURIComponent(reminderId)}`);

  const existing = await chrome.windows.getAll({ populate: true });
  for (const win of existing) {
    if (win.tabs) {
      for (const tab of win.tabs) {
        if (tab.url?.includes('reminder.html') && tab.url.includes(reminderId)) {
          if (win.id) {
            await chrome.windows.update(win.id, { focused: true, state: 'maximized' });
          }
          if (tab.id) await chrome.tabs.update(tab.id, { active: true });
          return;
        }
      }
    }
  }

  await chrome.windows.create({
    url,
    type: 'normal',
    state: 'maximized',
    focused: true,
  });
}

async function openWhatsApp(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: `${WHATSAPP_URL}*` });
  if (tabs.length > 0 && tabs[0].id) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: WHATSAPP_URL });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const reminders = await getAllReminders();
  const reminder = reminders.find((r) => r.id === alarm.name);
  if (!reminder || reminder.completed) return;

  await showReminderFullScreen(reminder.id);
});
