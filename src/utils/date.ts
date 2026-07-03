export function formatDateHe(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoDate;
  }
}

export function formatDateTimeHe(date: string, time: string): string {
  try {
    const dt = new Date(`${date}T${time}`);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dt);
  } catch {
    return `${date} ${time}`;
  }
}

export function formatTimeHe(time: string): string {
  try {
    const [hours, minutes] = time.split(':');
    const dt = new Date();
    dt.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dt);
  } catch {
    return time;
  }
}

export function toDateInputValue(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function toTimeInputValue(date: Date = new Date()): string {
  return date.toTimeString().slice(0, 5);
}

export function isFutureDateTime(date: string, time: string): boolean {
  const dt = new Date(`${date}T${time}`);
  return dt.getTime() > Date.now();
}

export function getReminderTimestamp(date: string, time: string): number {
  return new Date(`${date}T${time}`).getTime();
}

export function isReminderDue(reminder: { date: string; time: string; completed: boolean }): boolean {
  if (reminder.completed) return false;
  return getReminderTimestamp(reminder.date, reminder.time) <= Date.now();
}

export function sortRemindersByDate<T extends { date: string; time: string; completed: boolean }>(
  reminders: T[],
): T[] {
  return [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return getReminderTimestamp(a.date, a.time) - getReminderTimestamp(b.date, b.time);
  });
}

export function getUpcomingReminders<T extends { date: string; time: string; completed: boolean }>(
  reminders: T[],
  limit = 3,
): T[] {
  const now = Date.now();
  return reminders
    .filter((r) => !r.completed && getReminderTimestamp(r.date, r.time) >= now)
    .sort((a, b) => getReminderTimestamp(a.date, a.time) - getReminderTimestamp(b.date, b.time))
    .slice(0, limit);
}
