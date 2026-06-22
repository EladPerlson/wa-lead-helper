import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { ContactPanelGate } from '@/components/ContactPanelGate';
import { Textarea } from '@/components/Textarea';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';
import { he } from '@/i18n/he';
import type { ContactData, DetectedContact } from '@/types';

interface NotesPanelProps {
  contact: ContactData | null;
  detectedContact: DetectedContact | null;
  contactLoading?: boolean;
  onUpdate: (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => Promise<ContactData | null>;
}

export function NotesPanel({ contact, detectedContact, contactLoading, onUpdate }: NotesPanelProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(contact?.notes ?? '');
  }, [contact?.phoneNumber, contact]);

  const { saving, saved, saveNow } = useDebouncedSave({
    value: notes,
    saveTargetId: contact?.phoneNumber,
    onSave: async (value) => {
      if (!contact) return;
      await onUpdate({ notes: value });
    },
    delay: 1000,
  });

  return (
    <ContactPanelGate
      detectedContact={detectedContact}
      contact={contact}
      contactLoading={contactLoading}
    >
      {contact && (
        <div className="p-4 space-y-3 animate-fade-in" dir="rtl">
          <Textarea
            label={he.notes.title}
            placeholder={he.notes.placeholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <Button onClick={saveNow} disabled={saving} size="sm">
              {he.notes.save}
            </Button>
            <span className="text-xs text-notion-muted">
              {saving ? he.notes.saving : saved ? he.notes.saved : ''}
            </span>
          </div>
        </div>
      )}
    </ContactPanelGate>
  );
}
