import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { LeadStatusPicker } from '@/components/LeadStatusPicker';
import { useTags } from '@/hooks/useStorageLists';
import { useAllContacts } from '@/hooks/useAllContacts';
import { ContactPanelGate } from '@/components/ContactPanelGate';
import { he } from '@/i18n/he';
import type { ContactData, DetectedContact, LeadStatus } from '@/types';
import { generateId, cn } from '@/utils/id';
import type { PlanLimits } from '@/plans';
import { isUnlimited } from '@/plans';
import { canTagCustomer, countTaggedCustomers } from '@/utils/limits';

interface TagsPanelProps {
  contact: ContactData | null;
  detectedContact: DetectedContact | null;
  contactLoading?: boolean;
  limits: PlanLimits;
  onUpdate: (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => Promise<ContactData | null>;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onUpgradeNeeded?: () => void;
}

const TAG_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#00ADB5', '#8b5cf6', '#ec4899', '#6b7280'];
const DEFAULT_TAG_IDS = ['hot-lead', 'follow-up', 'active-client', 'deal-closed', 'not-relevant'];

const TAG_ICONS: Record<string, string> = {
  'hot-lead': '🔥',
  'follow-up': '📞',
  'active-client': '✓',
  'deal-closed': '💰',
  'not-relevant': '✕',
};

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
  onUpgradeNeeded,
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
          onUpgradeNeeded={onUpgradeNeeded}
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
  onUpgradeNeeded,
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
  onUpgradeNeeded?: () => void;
  limits: PlanLimits;
  addTag: ReturnType<typeof useTags>['addTag'];
  removeGlobalTag: ReturnType<typeof useTags>['removeTag'];
}) {
  const [selected, setSelected] = useState<string[]>(contact.tags);
  const [saving, setSaving] = useState(false);
  const [taggedCount, setTaggedCount] = useState(0);
  const { contacts } = useAllContacts();

  useEffect(() => {
    setSelected(contact.tags);
    setSaving(false);
  }, [contact.phoneNumber, contact.tags]);

  useEffect(() => {
    void countTaggedCustomers().then(setTaggedCount);
  }, [contacts]);

  const isDirty = useMemo(() => !tagsEqual(selected, contact.tags), [selected, contact.tags]);
  const showFreeNudge =
    !isUnlimited(limits.taggedCustomers) && taggedCount >= limits.taggedCustomers;

  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of contacts) {
      for (const tagId of c.tags) {
        map[tagId] = (map[tagId] ?? 0) + 1;
      }
    }
    return map;
  }, [contacts]);

  const toggleTag = (tagId: string) => {
    setSelected((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleStatusChange = async (status: LeadStatus) => {
    await onUpdate({ status });
    onToast(he.leadStatus.updated, 'success');
  };

  const handleSaveTags = async () => {
    if (!isDirty || saving) return;

    const check = await canTagCustomer(limits, contact.phoneNumber, selected);
    if (!check.allowed) {
      onUpgradeNeeded?.();
      onToast(he.tags.freeNudge.replace('{count}', String(limits.taggedCustomers)), 'error');
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
    <div className="p-4 space-y-4 animate-rise" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="text-right min-w-0">
          <h2 className="text-base font-bold text-notion-text flex items-center gap-2 justify-end">
            <span>◆</span>
            <span>{he.tags.title}</span>
          </h2>
          <p className="text-xs text-notion-muted mt-1 leading-relaxed">{he.tags.subtitle}</p>
          <p className="text-[11px] text-notion-muted mt-1">{he.tags.shortcutHint}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="shrink-0">
          + {he.tags.addTag}
        </Button>
      </div>

      <Card>
        <LeadStatusPicker status={contact.status} onChange={(s) => void handleStatusChange(s)} />
      </Card>

      {showFreeNudge && (
        <button
          type="button"
          onClick={() => onUpgradeNeeded?.()}
          className="w-full text-right text-xs rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2.5"
        >
          {he.tags.freeNudge.replace('{count}', String(taggedCount))}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {tags.map((tag) => {
          const active = selected.includes(tag.id);
          const icon = tag.emoji || TAG_ICONS[tag.id] || '●';
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={cn(
                'relative text-right rounded-3xl p-3.5 transition-all duration-200',
                'border backdrop-blur-md group',
                active
                  ? 'shadow-glow-sm scale-[1.01]'
                  : 'opacity-90 hover:opacity-100 hover:scale-[1.01]',
              )}
              style={{
                backgroundColor: `${tag.color}14`,
                borderColor: active ? tag.color : `${tag.color}40`,
                boxShadow: active ? `0 0 20px ${tag.color}33` : undefined,
              }}
            >
              {!DEFAULT_TAG_IDS.includes(tag.id) && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCustomTag(tag.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveCustomTag(tag.id);
                    }
                  }}
                  className="absolute top-2 left-2 w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-50 hover:opacity-100 bg-black/20 text-notion-text"
                  aria-label={he.tags.remove}
                >
                  ✕
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <span
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0"
                  style={{
                    backgroundColor: `${tag.color}28`,
                    color: tag.color,
                    boxShadow: `0 0 12px ${tag.color}33`,
                  }}
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: tag.color }}>
                    {tag.label}
                  </p>
                  <p className="text-[10px] text-notion-muted mt-0.5 tabular-nums">
                    {tagCounts[tag.id] ?? 0}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-3xl p-3.5 border border-dashed border-notion-accent/35 text-notion-accent/80 hover:text-notion-accent hover:border-notion-accent hover:bg-notion-soft transition-all flex flex-col items-center justify-center gap-1 min-h-[72px]"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-[10px] font-semibold">{he.tags.addTag}</span>
        </button>
      </div>

      {isDirty && (
        <Button size="md" onClick={handleSaveTags} disabled={saving} className="w-full">
          {saving ? he.tags.saving : he.tags.saveTags}
        </Button>
      )}

      {showForm && (
        <Card className="wa-lh-glow-ring">
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
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? '#EEEEEE' : 'transparent',
                      boxShadow: newColor === color ? `0 0 0 2px ${color}, 0 0 12px ${color}66` : undefined,
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
