import type { Reminder } from '@/types';
import { getReminderTimestamp } from './date';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateIcs(reminder: Reminder, contactName?: string): string {
  const start = new Date(getReminderTimestamp(reminder.date, reminder.time));
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const now = new Date();
  const uid = `${reminder.id}@wa-lead-helper`;

  const description = contactName
    ? `לקוח: ${contactName}\\nטלפון: ${reminder.phoneNumber}`
    : `טלפון: ${reminder.phoneNumber}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WA Lead Helper//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(reminder.title)}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(reminder.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(reminder: Reminder, contactName?: string): void {
  const ics = generateIcs(reminder, contactName);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `תזכורת-${reminder.title.slice(0, 20).replace(/\s/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
