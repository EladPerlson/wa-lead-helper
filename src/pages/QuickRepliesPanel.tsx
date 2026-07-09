import { useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox';
import { Textarea } from '@/components/Textarea';
import { Card } from '@/components/Card';
import { useTemplates } from '@/hooks/useStorageLists';
import { he } from '@/i18n/he';
import type { ContactData } from '@/types';
import { generateId } from '@/utils/id';
import { injectTextToWhatsApp } from '@/utils/waDom';

import type { PlanLimits } from '@/plans';
import { canAddTemplate } from '@/utils/limits';
import { isUnlimited } from '@/plans';

interface QuickRepliesPanelProps {
  contact: ContactData | null;
  limits: PlanLimits;
  onUpdate: (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => Promise<ContactData | null>;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function QuickRepliesPanel({ contact, limits, onUpdate, onToast }: QuickRepliesPanelProps) {
  const { templates, addTemplate, removeTemplate } = useTemplates();
  const [search, setSearch] = useState('');
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.trim().toLowerCase();
    return templates.filter((t) => t.text.toLowerCase().includes(q));
  }, [templates, search]);

  const handleInsert = async (text: string) => {
    const success = injectTextToWhatsApp(text);
    if (success) {
      if (contact) {
        await onUpdate({ templatesUsed: (contact.templatesUsed ?? 0) + 1 });
      }
      onToast(he.replies.inserted, 'success');
    } else {
      onToast(he.common.error, 'error');
    }
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    if (!(await canAddTemplate(limits, templates.length))) {
      onToast(he.replies.limitReached, 'error');
      return;
    }
    await addTemplate({
      id: generateId('tpl'),
      text: newText.trim(),
      createdAt: new Date().toISOString(),
    });
    setNewText('');
    setShowAdd(false);
    onToast(he.common.success, 'success');
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <h3 className="text-sm font-semibold text-notion-text text-right">{he.replies.title}</h3>

      <SearchBox
        label={he.replies.search}
        placeholder={he.replies.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2 max-h-[280px] overflow-y-auto wa-lh-scroll">
        {filtered.length === 0 ? (
          <p className="text-xs text-notion-muted text-right">
            {search ? he.replies.noResults : he.replies.empty}
          </p>
        ) : (
          filtered.map((tpl) => (
            <Card key={tpl.id} className="p-3 cursor-pointer hover:border-notion-accent/50 transition-colors group">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => removeTemplate(tpl.id)}
                  className="opacity-0 group-hover:opacity-100 text-notion-muted hover:text-red-500 text-xs shrink-0 transition-opacity"
                  title={he.replies.delete}
                >
                  🗑️
                </button>
                <button
                  type="button"
                  onClick={() => handleInsert(tpl.text)}
                  className="flex-1 text-sm text-notion-text text-right leading-relaxed hover:text-notion-accent transition-colors"
                >
                  {tpl.text}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {!showAdd ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdd(true)}
          disabled={!isUnlimited(limits.templates) && templates.length >= limits.templates}
        >
          + {he.replies.add}
        </Button>
      ) : (
        <Card>
          <div className="space-y-3">
            <Textarea
              placeholder={he.replies.addPlaceholder}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>
                {he.replies.add}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                {he.common.cancel}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
