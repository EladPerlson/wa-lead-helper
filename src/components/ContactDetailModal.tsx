import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTags } from '@/hooks/useStorageLists';
import { he } from '@/i18n/he';
import type { ContactData } from '@/types';
import { formatDateHe, formatDateTimeHe, sortRemindersByDate } from '@/utils/date';
import { getContactLabel, getContactPhoneSubtitle } from '@/utils/contactDisplay';

interface ContactDetailModalProps {
  contact: ContactData;
  onClose: () => void;
  onOpenChat: (contact: ContactData) => void;
}

export function ContactDetailModal({ contact, onClose, onOpenChat }: ContactDetailModalProps) {
  const { tags } = useTags();
  const contactTags = tags.filter((t) => contact.tags.includes(t.id));
  const reminders = sortRemindersByDate(contact.reminders);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-notion-bg" dir="rtl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-notion-border bg-notion-surface shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-notion-muted hover:bg-notion-border/50"
          aria-label={he.common.close}
        >
          ✕
        </button>
        <div className="flex-1 text-right mr-2">
          <h2 className="text-sm font-bold text-notion-text">{getContactLabel(contact)}</h2>
          {getContactPhoneSubtitle(contact) && (
            <p className="text-xs text-notion-muted">{getContactPhoneSubtitle(contact)}</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto wa-lh-scroll p-4 space-y-4 animate-fade-in">
        <Card>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dd className="text-notion-text">{formatDateHe(contact.createdAt)}</dd>
              <dt className="text-notion-muted">{he.customers.createdAt}</dt>
            </div>
            <div className="flex justify-between">
              <dd className="text-notion-text">{contact.templatesUsed}</dd>
              <dt className="text-notion-muted">{he.customers.templatesUsed}</dt>
            </div>
          </dl>
        </Card>

        <Card title={he.customers.allTags}>
          {contactTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contactTags.map((tag) => (
                <Badge key={tag.id} label={tag.label} color={tag.color} emoji={tag.emoji} active />
              ))}
            </div>
          ) : (
            <p className="text-xs text-notion-muted text-right">{he.customers.noTags}</p>
          )}
        </Card>

        <Card title={he.customers.allNotes}>
          <p className="text-sm text-notion-text text-right leading-relaxed whitespace-pre-wrap">
            {contact.notes || he.customers.noNotes}
          </p>
        </Card>

        <Card title={he.customers.allReminders}>
          {reminders.length > 0 ? (
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li key={r.id} className={`text-sm text-right ${r.completed ? 'opacity-50' : ''}`}>
                  <span className="text-notion-text">{r.title}</span>
                  <span className="text-notion-muted text-xs mr-2">
                    — {formatDateTimeHe(r.date, r.time)}
                  </span>
                  {r.completed && (
                    <span className="text-green-600 text-xs mr-1">({he.reminders.completed})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-notion-muted text-right">{he.customers.noReminders}</p>
          )}
        </Card>
      </div>

      <footer className="p-4 border-t border-notion-border shrink-0">
        <Button className="w-full" onClick={() => onOpenChat(contact)}>
          {he.customers.openChat}
        </Button>
      </footer>
    </div>
  );
}
