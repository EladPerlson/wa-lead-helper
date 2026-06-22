import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useSettings } from '@/hooks/useSettings';
import { he } from '@/i18n/he';
import { getAllReminders, getContact, markReminderComplete } from '@/storage';
import type { ContactData, Reminder } from '@/types';
import { formatDateTimeHe } from '@/utils/date';
import { downloadIcs } from '@/utils/calendar';
import { getContactLabel, getContactPhoneSubtitle } from '@/utils/contactDisplay';
import { safeRuntimeSendMessage } from '@/utils/extensionContext';
import { openChatForContact } from '@/utils/waDom';

interface ReminderViewProps {
  reminderId: string;
  mode?: 'overlay' | 'window';
  onClose: () => void;
}

export function ReminderView({ reminderId, mode = 'overlay', onClose }: ReminderViewProps) {
  const { settings } = useSettings();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    (async () => {
      const reminders = await getAllReminders();
      const found = reminders.find((r) => r.id === reminderId);
      if (found) {
        setReminder(found);
        setCompleted(found.completed);
        const c = await getContact(found.phoneNumber);
        setContact(c);
      }
      setLoading(false);
    })();
  }, [reminderId]);

  const handleOpenChat = () => {
    if (!reminder) return;
    const label = contact
      ? getContactLabel(contact)
      : undefined;
    openChatForContact(reminder.phoneNumber, label);
    onClose();
    if (mode === 'window') window.close();
  };

  const handleComplete = async () => {
    if (!reminder) return;
    await safeRuntimeSendMessage({ type: 'CANCEL_REMINDER', reminderId: reminder.id });
    await markReminderComplete(reminder.id);
    setCompleted(true);
  };

  const handleAddToCalendar = () => {
    if (!reminder) return;
    downloadIcs(reminder, contact ? getContactLabel(contact) : undefined);
  };

  const handleDismiss = () => {
    onClose();
    if (mode === 'window') window.close();
  };

  const shellClass =
    mode === 'overlay'
      ? 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in'
      : 'min-h-screen w-full flex items-center justify-center p-6 bg-notion-bg';

  const cardClass =
    mode === 'overlay'
      ? 'w-full max-w-lg shadow-notion-lg animate-slide-in'
      : 'w-full max-w-xl shadow-notion-lg';

  if (loading) {
    return (
      <div className={shellClass} dir="rtl">
        <div className="text-notion-text font-heebo text-lg">{he.common.loading}</div>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className={shellClass} dir="rtl">
        <Card className="p-6 text-center">
          <p className="text-notion-muted">{he.reminderPopup.notFound}</p>
          <Button className="mt-4" onClick={handleDismiss}>
            {he.common.close}
          </Button>
        </Card>
      </div>
    );
  }

  const contactLabel = contact ? getContactLabel(contact) : null;
  const contactPhone = contact ? getContactPhoneSubtitle(contact) : null;

  return (
    <div
      className={shellClass}
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', Arial, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-lh-reminder-title"
    >
      <Card className={`${cardClass} p-6 md:p-8`}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-notion-accent text-white flex items-center justify-center text-3xl mb-4 wa-lh-pulse">
            ⏰
          </div>
          <p className="text-sm text-notion-muted mb-1">{he.reminderPopup.title}</p>
          <h1 id="wa-lh-reminder-title" className="text-2xl md:text-3xl font-bold text-notion-text leading-snug">
            {reminder.title}
          </h1>
          <p className="text-lg text-notion-accent font-semibold mt-3">
            {formatDateTimeHe(reminder.date, reminder.time)}
          </p>
        </div>

        <dl className="space-y-3 text-sm mb-6 bg-notion-surface rounded-xl p-4">
          {contactLabel && (
            <div className="flex justify-between gap-4">
              <dd className="text-notion-text font-medium">{contactLabel}</dd>
              <dt className="text-notion-muted shrink-0">{he.reminderPopup.customer}</dt>
            </div>
          )}
          {contactPhone && (
            <div className="flex justify-between gap-4">
              <dd className="text-notion-text">{contactPhone}</dd>
              <dt className="text-notion-muted shrink-0">{he.reminderPopup.phone}</dt>
            </div>
          )}
          {completed && (
            <p className="text-green-600 text-sm text-center pt-1">{he.reminders.completed}</p>
          )}
        </dl>

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={handleOpenChat}>
            {he.reminderPopup.openWhatsApp}
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleAddToCalendar}>
            {he.reminderPopup.addToCalendar}
          </Button>
          {!completed && (
            <Button variant="secondary" className="w-full" onClick={handleComplete}>
              {he.reminderPopup.markComplete}
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={handleDismiss}>
            {he.common.close}
          </Button>
        </div>
      </Card>
    </div>
  );
}
