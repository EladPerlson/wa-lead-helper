import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useTags } from '@/hooks/useStorageLists';
import { ContactPanelGate } from '@/components/ContactPanelGate';
import { he } from '@/i18n/he';
import type { ContactData, DetectedContact } from '@/types';
import { generateId } from '@/utils/id';
import type { PlanLimits } from '@/plans';
import { canTagCustomer } from '@/utils/limits';

interface TagsPanelProps {
  contact: ContactData | null;
  detectedContact: DetectedContact | null;
  contactLoading?: boolean;
  limits: PlanLimits;
  onUpdate: (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => Promise<ContactData | null>;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const TAG_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];
const DEFAULT_TAG_IDS = ['hot-lead', 'follow-up', 'active-client', 'deal-closed', 'not-relevant'];

function tagsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

export function TagsPanel({
  contact,
  detectedContact,
  contactLoading,
  limits,
  onUpdate,
  onToast,
}: TagsPanelProps) {
  const { tags, addTag, removeTag: removeGlobalTag } = useTags();
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);

  return (
    <ContactPanelGate
      detectedContact={detectedContact}
      contact={contact}
      contactLoading={contactLoading}
    >
      {contact && (
        <TagsPanelContent
          contact={contact}
          tags={tags}
          showForm={showForm}
          setShowForm={setShowForm}
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          newColor={newColor}
          setNewColor={setNewColor}
          onUpdate={onUpdate}
          onToast={onToast}
          limits={limits}
          addTag={addTag}
          removeGlobalTag={removeGlobalTag}
        />
      )}
    </ContactPanelGate>
  );
}

function TagsPanelContent({
  contact,
  tags,
  showForm,
  setShowForm,
  newLabel,
  setNewLabel,
  newColor,
  setNewColor,
  onUpdate,
  onToast,
  limits,
  addTag,
  removeGlobalTag,
}: {
  contact: ContactData;
  tags: ReturnType<typeof useTags>['tags'];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  newLabel: string;
  setNewLabel: (v: string) => void;
  newColor: string;
  setNewColor: (v: string) => void;
  onUpdate: TagsPanelProps['onUpdate'];
  onToast: TagsPanelProps['onToast'];
  limits: PlanLimits;
  addTag: ReturnType<typeof useTags>['addTag'];
  removeGlobalTag: ReturnType<typeof useTags>['removeTag'];
}) {
  const [selected, setSelected] = useState<string[]>(contact.tags);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(contact.tags);
    setSaving(false);
  }, [contact.phoneNumber, contact.tags]);

  const isDirty = useMemo(() => !tagsEqual(selected, contact.tags), [selected, contact.tags]);

  const toggleTag = (tagId: string) => {
    setSelected((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSaveTags = async () => {
    if (!isDirty || saving) return;

    const check = await canTagCustomer(limits, contact.phoneNumber, selected);
    if (!check.allowed) {
      onToast(he.tags.limitReached, 'error');
      return;
    }

    setSaving(true);
    try {
      await onUpdate({ tags: selected });
      onToast(he.tags.savedSuccess, 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newLabel.trim()) return;

    const tag = {
      id: generateId('tag'),
      label: newLabel.trim(),
      color: newColor,
    };

    await addTag(tag);
    setSelected((prev) => [...prev, tag.id]);
    setNewLabel('');
    setShowForm(false);
  };

  const handleRemoveCustomTag = async (tagId: string) => {
    if (selected.includes(tagId)) {
      setSelected((prev) => prev.filter((id) => id !== tagId));
    }
    if (!DEFAULT_TAG_IDS.includes(tagId)) {
      await removeGlobalTag(tagId);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <div>
        <h3 className="text-sm font-semibold text-notion-text mb-3 text-right">{he.tags.title}</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              label={tag.label}
              color={tag.color}
              emoji={tag.emoji}
              active={selected.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
              onRemove={() => handleRemoveCustomTag(tag.id)}
            />
          ))}
        </div>
        {selected.length === 0 && (
          <p className="text-xs text-notion-muted mt-2 text-right">{he.tags.noTags}</p>
        )}
      </div>

      {isDirty && (
        <Button size="sm" onClick={handleSaveTags} disabled={saving}>
          {saving ? he.tags.saving : he.tags.saveTags}
        </Button>
      )}

      {!showForm ? (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          + {he.tags.addTag}
        </Button>
      ) : (
        <Card>
          <div className="space-y-3">
            <Input
              label={he.tags.tagName}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={he.tags.tagName}
            />
            <div>
              <span className="text-sm font-medium text-notion-text block mb-2 text-right">
                {he.tags.tagColor}
              </span>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? '#fff' : 'transparent',
                      boxShadow: newColor === color ? `0 0 0 2px ${color}` : undefined,
                    }}
                    aria-label={he.tags.tagColor}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateTag}>
                {he.tags.create}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                {he.tags.cancel}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
