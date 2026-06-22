import { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useReminders } from '@/hooks/useReminders';
import { ContactPanelGate } from '@/components/ContactPanelGate';
import { he } from '@/i18n/he';
import type { ContactData, DetectedContact, Reminder } from '@/types';
import { formatDateTimeHe, isFutureDateTime, sortRemindersByDate, toDateInputValue, toTimeInputValue } from '@/utils/date';
import { generateId } from '@/utils/id';
import { safeRuntimeSendMessage } from '@/utils/extensionContext';

interface RemindersPanelProps {
  contact: ContactData | null;
  detectedContact: DetectedContact | null;
  contactLoading?: boolean;
  onUpdate: (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => Promise<ContactData | null>;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function RemindersPanel({ contact, detectedContact, contactLoading, onUpdate, onToast }: RemindersPanelProps) {
  const { scheduleReminder, cancelReminder } = useReminders();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toDateInputValue());
  const [time, setTime] = useState(toTimeInputValue(new Date(Date.now() + 3600000)));

  const handleOpenPopup = async (reminder: Reminder) => {
    await safeRuntimeSendMessage({ type: 'OPEN_REMINDER_POPUP', reminderId: reminder.id });
  };

  return (
    <ContactPanelGate
      detectedContact={detectedContact}
      contact={contact}
      contactLoading={contactLoading}
    >
      {contact && (
        <RemindersPanelContent
          contact={contact}
          showForm={showForm}
          setShowForm={setShowForm}
          title={title}
          setTitle={setTitle}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          onUpdate={onUpdate}
          onToast={onToast}
          scheduleReminder={scheduleReminder}
          cancelReminder={cancelReminder}
          handleOpenPopup={handleOpenPopup}
        />
      )}
    </ContactPanelGate>
  );
}

function RemindersPanelContent({
  contact,
  showForm,
  setShowForm,
  title,
  setTitle,
  date,
  setDate,
  time,
  setTime,
  onUpdate,
  onToast,
  scheduleReminder,
  cancelReminder,
  handleOpenPopup,
}: {
  contact: ContactData;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  onUpdate: RemindersPanelProps['onUpdate'];
  onToast: RemindersPanelProps['onToast'];
  scheduleReminder: ReturnType<typeof useReminders>['scheduleReminder'];
  cancelReminder: ReturnType<typeof useReminders>['cancelReminder'];
  handleOpenPopup: (reminder: Reminder) => Promise<void>;
}) {
  const reminders = sortRemindersByDate(contact.reminders);

  const handleCreate = async () => {
    if (!title.trim()) return;
    if (!isFutureDateTime(date, time)) {
      onToast(he.reminders.invalidDate, 'error');
      return;
    }

    const reminder: Reminder = {
      id: generateId('rem'),
      title: title.trim(),
      date,
      time,
      completed: false,
      createdAt: new Date().toISOString(),
      phoneNumber: contact.phoneNumber,
    };

    const updatedReminders = [...contact.reminders, reminder];
    await onUpdate({ reminders: updatedReminders });
    await scheduleReminder(reminder);

    setTitle('');
    setShowForm(false);
    onToast(he.reminders.scheduled, 'success');
  };

  const handleDelete = async (reminder: Reminder) => {
    await cancelReminder(reminder.id);
    await onUpdate({
      reminders: contact.reminders.filter((r) => r.id !== reminder.id),
    });
  };

  const handleComplete = async (reminder: Reminder) => {
    await cancelReminder(reminder.id);
    await onUpdate({
      reminders: contact.reminders.map((r) =>
        r.id === reminder.id ? { ...r, completed: true } : r,
      ),
    });
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <h3 className="text-sm font-semibold text-notion-text text-right">{he.reminders.title}</h3>

      <div className="space-y-2 max-h-[320px] overflow-y-auto wa-lh-scroll">
        {reminders.length === 0 ? (
          <p className="text-xs text-notion-muted text-right">{he.reminders.empty}</p>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className={`p-3 ${reminder.completed ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-1 shrink-0">
                  {!reminder.completed && (
                    <button
                      type="button"
                      onClick={() => handleComplete(reminder)}
                      className="text-green-500 hover:text-green-600 text-sm"
                      title={he.reminders.complete}
                    >
                      ✓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(reminder)}
                    className="text-notion-muted hover:text-red-500 text-sm"
                    title={he.reminders.delete}
                  >
                    🗑️
                  </button>
                </div>
                <div className="flex-1 text-right cursor-pointer" onClick={() => handleOpenPopup(reminder)}>
                  <p className="text-sm font-medium text-notion-text hover:text-notion-accent transition-colors">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-notion-muted mt-0.5">
                    {formatDateTimeHe(reminder.date, reminder.time)}
                  </p>
                  {reminder.completed && (
                    <span className="text-xs text-green-600 mt-1 inline-block">{he.reminders.completed}</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {!showForm ? (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          + {he.reminders.add}
        </Button>
      ) : (
        <Card>
          <div className="space-y-3">
            <Input
              label={he.reminders.titleLabel}
              placeholder={he.reminders.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label={he.reminders.dateLabel}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label={he.reminders.timeLabel}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>
                {he.reminders.create}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                {he.common.cancel}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
