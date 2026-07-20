import { useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ContactDetailModal } from '@/components/ContactDetailModal';
import { SearchBox } from '@/components/SearchBox';
import { useAllContacts } from '@/hooks/useAllContacts';
import { useTags } from '@/hooks/useStorageLists';
import { he } from '@/i18n/he';
import type { ContactData, LeadStatus } from '@/types';
import { getContactLabel, getContactPhoneSubtitle } from '@/utils/contactDisplay';
import { formatDateTimeHe, getUpcomingReminders } from '@/utils/date';
import { getLeadStatus } from '@/utils/leadStatus';
import { openChatForContact } from '@/utils/waDom';

interface CustomersPanelProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function statusLabel(status: LeadStatus): string {
  switch (status) {
    case 'following':
      return he.leadStatus.following;
    case 'closed':
      return he.leadStatus.closed;
    default:
      return he.leadStatus.new;
  }
}

export function CustomersPanel({ onToast }: CustomersPanelProps) {
  const { contacts, loading } = useAllContacts();
  const { tags } = useTags();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [expandedContact, setExpandedContact] = useState<ContactData | null>(null);
  const [notesContact, setNotesContact] = useState<ContactData | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (tagFilter && !c.tags.includes(tagFilter)) return false;
      if (statusFilter && getLeadStatus(c) !== statusFilter) return false;
      if (!q) return true;

      const label = getContactLabel(c).toLowerCase();
      const subtitle = getContactPhoneSubtitle(c)?.toLowerCase() ?? '';
      const notes = c.notes.toLowerCase();
      const phone = c.phoneNumber.toLowerCase();
      const tagText = tags
        .filter((t) => c.tags.includes(t.id))
        .map((t) => t.label.toLowerCase())
        .join(' ');
      const statusText = statusLabel(getLeadStatus(c)).toLowerCase();

      return (
        label.includes(q) ||
        subtitle.includes(q) ||
        notes.includes(q) ||
        phone.includes(q) ||
        tagText.includes(q) ||
        statusText.includes(q)
      );
    });
  }, [contacts, search, tagFilter, statusFilter, tags]);

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

  if (notesContact) {
    return (
      <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setNotesContact(null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-notion-muted hover:bg-notion-soft hover:text-notion-text"
            aria-label={he.common.close}
          >
            ✕
          </button>
          <div className="flex-1 text-right min-w-0">
            <h3 className="text-sm font-bold text-notion-text truncate">
              {he.customers.allNotes}
            </h3>
            <p className="text-xs text-notion-muted truncate">{getContactLabel(notesContact)}</p>
          </div>
        </div>
        <Card className="p-3">
          <p className="text-sm text-notion-text text-right leading-relaxed whitespace-pre-wrap">
            {notesContact.notes?.trim() ? notesContact.notes : he.customers.noNotes}
          </p>
        </Card>
        <Button variant="secondary" className="w-full" onClick={() => setNotesContact(null)}>
          {he.common.close}
        </Button>
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
    <div className="p-4 space-y-4 animate-rise" dir="rtl">
      <h3 className="text-base font-bold text-notion-text text-right">{he.customers.title}</h3>

      <SearchBox
        label={he.customers.search}
        placeholder={he.customers.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="text-right space-y-1">
          <span className="text-[11px] text-notion-muted block">{he.customers.filterByTag}</span>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full text-xs rounded-lg border border-notion-border bg-notion-surface text-notion-text px-2 py-2 text-right"
          >
            <option value="">{he.customers.filterAllTags}</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji ? `${t.emoji} ` : ''}
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-right space-y-1">
          <span className="text-[11px] text-notion-muted block">{he.customers.filterByStatus}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
            className="w-full text-xs rounded-lg border border-notion-border bg-notion-surface text-notion-text px-2 py-2 text-right"
          >
            <option value="">{he.customers.filterAllStatuses}</option>
            <option value="new">{he.leadStatus.new}</option>
            <option value="following">{he.leadStatus.following}</option>
            <option value="closed">{he.leadStatus.closed}</option>
          </select>
        </label>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto wa-lh-scroll">
        {filtered.length === 0 ? (
          <p className="text-xs text-notion-muted text-right">
            {search || tagFilter || statusFilter ? he.customers.noResults : he.customers.empty}
          </p>
        ) : (
          filtered.map((contact) => {
            const contactTags = tags.filter((t) => contact.tags.includes(t.id));
            const upcoming = getUpcomingReminders(contact.reminders, 1)[0];
            const label = getContactLabel(contact);
            const subtitle = getContactPhoneSubtitle(contact);
            const status = getLeadStatus(contact);

            return (
              <Card key={contact.phoneNumber} className="p-3">
                <div className="text-right">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setNotesContact(contact)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sm bg-notion-soft text-notion-accent hover:bg-notion-accent hover:text-white transition-colors"
                        title={he.customers.viewNotes}
                        aria-label={he.customers.viewNotes}
                      >
                        📝
                      </button>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-notion-soft text-notion-muted">
                        {statusLabel(status)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-notion-text truncate">{label}</p>
                  </div>
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
