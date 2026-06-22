import { useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ContactDetailModal } from '@/components/ContactDetailModal';
import { SearchBox } from '@/components/SearchBox';
import { useAllContacts } from '@/hooks/useAllContacts';
import { useTags } from '@/hooks/useStorageLists';
import { he } from '@/i18n/he';
import type { ContactData } from '@/types';
import { getContactLabel, getContactPhoneSubtitle } from '@/utils/contactDisplay';
import { formatDateTimeHe, getUpcomingReminders } from '@/utils/date';
import { openChatForContact } from '@/utils/waDom';

interface CustomersPanelProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function CustomersPanel({ onToast }: CustomersPanelProps) {
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

  const handleOpenChat = (contact: ContactData) => {
    const success = openChatForContact(contact.phoneNumber, getContactLabel(contact));
    if (success) {
      onToast(he.customers.openChat, 'success');
      setExpandedContact(null);
    } else {
      onToast(he.common.error, 'error');
    }
  };

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
        onOpenChat={handleOpenChat}
      />
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <h3 className="text-sm font-semibold text-notion-text text-right">{he.customers.title}</h3>

      <SearchBox
        label={he.customers.search}
        placeholder={he.customers.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2 max-h-[420px] overflow-y-auto wa-lh-scroll">
        {filtered.length === 0 ? (
          <p className="text-xs text-notion-muted text-right">
            {search ? he.customers.noResults : he.customers.empty}
          </p>
        ) : (
          filtered.map((contact) => {
            const contactTags = tags.filter((t) => contact.tags.includes(t.id));
            const upcoming = getUpcomingReminders(contact.reminders, 1)[0];
            const label = getContactLabel(contact);
            const subtitle = getContactPhoneSubtitle(contact);

            return (
              <Card key={contact.phoneNumber} className="p-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-notion-text truncate">{label}</p>
                  {subtitle && <p className="text-xs text-notion-muted mt-0.5">{subtitle}</p>}

                  {contactTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-end">
                      {contactTags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          label={tag.label}
                          color={tag.color}
                          emoji={tag.emoji}
                          active
                        />
                      ))}
                      {contactTags.length > 3 && (
                        <span className="text-xs text-notion-muted">+{contactTags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {contact.notes && (
                    <p className="text-xs text-notion-muted mt-2 line-clamp-2 leading-relaxed">
                      {contact.notes}
                    </p>
                  )}

                  {upcoming && (
                    <p className="text-xs text-notion-accent mt-1.5">
                      ⏰ {upcoming.title} — {formatDateTimeHe(upcoming.date, upcoming.time)}
                    </p>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setExpandedContact(contact)}
                  >
                    🔍 {he.customers.expand}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
