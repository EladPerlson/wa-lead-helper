import { useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { ContactDetailModal } from '@/components/ContactDetailModal';
import { SearchBox } from '@/components/SearchBox';
import { useAllContacts } from '@/hooks/useAllContacts';
import { useTags } from '@/hooks/useStorageLists';
import { he } from '@/i18n/he';
import type { ContactData } from '@/types';
import { getContactLabel, getContactPhoneSubtitle } from '@/utils/contactDisplay';
import { formatDateHe, formatDateTimeHe, getUpcomingReminders } from '@/utils/date';

export function HistoryPanel() {
  const { contacts, loading } = useAllContacts();
  const { tags } = useTags();
  const [search, setSearch] = useState('');
  const [expandedContact, setExpandedContact] = useState<ContactData | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      const label = getContactLabel(c).toLowerCase();
      const subtitle = getContactPhoneSubtitle(c)?.toLowerCase() ?? '';
      return label.includes(q) || subtitle.includes(q) || c.notes.toLowerCase().includes(q);
    });
  }, [contacts, search]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-notion-muted text-right" dir="rtl">
        {he.common.loading}
      </div>
    );
  }

  if (expandedContact) {
    return (
      <ContactDetailModal
        contact={expandedContact}
        onClose={() => setExpandedContact(null)}
        onOpenChat={() => setExpandedContact(null)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4 animate-rise" dir="rtl">
      <h3 className="text-base font-bold text-notion-text text-right">{he.history.title}</h3>

      <SearchBox
        label={he.customers.search}
        placeholder={he.customers.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2 max-h-[420px] overflow-y-auto wa-lh-scroll">
        {filtered.length === 0 ? (
          <p className="text-xs text-notion-muted text-right">{he.customers.empty}</p>
        ) : (
          filtered.map((contact) => {
            const label = getContactLabel(contact);
            const subtitle = getContactPhoneSubtitle(contact);
            const contactTags = tags.filter((t) => contact.tags.includes(t.id));
            const upcoming = getUpcomingReminders(contact.reminders, 1)[0];

            return (
              <div key={contact.phoneNumber} onClick={() => setExpandedContact(contact)} role="button" tabIndex={0}>
                <Card className="p-3 cursor-pointer hover:border-notion-accent/40 transition-colors">
                <div className="text-right">
                  <p className="text-sm font-semibold text-notion-text">{label}</p>
                  {subtitle && <p className="text-xs text-notion-muted mt-0.5">{subtitle}</p>}

                  <div className="flex flex-wrap gap-2 mt-2 justify-end text-xs text-notion-muted">
                    <span>{he.history.createdAt}: {formatDateHe(contact.createdAt)}</span>
                    <span>•</span>
                    <span>{he.history.templatesUsed}: {contact.templatesUsed}</span>
                  </div>

                  {contactTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-end">
                      {contactTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          label={tag.label}
                          color={tag.color}
                          emoji={tag.emoji}
                          active
                        />
                      ))}
                    </div>
                  )}

                  {contact.notes && (
                    <p className="text-xs text-notion-muted mt-2 line-clamp-2">{contact.notes}</p>
                  )}

                  {upcoming && (
                    <p className="text-xs text-notion-accent mt-1.5">
                      ⏰ {upcoming.title} — {formatDateTimeHe(upcoming.date, upcoming.time)}
                    </p>
                  )}
                </div>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
