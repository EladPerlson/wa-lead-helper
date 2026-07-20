import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/id';
import type { TabId } from '@/types';
import { he } from '@/i18n/he';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  showAdmin?: boolean;
  totalLeads?: number;
}

const PRIMARY: { id: TabId; label: string; icon: string }[] = [
  { id: 'replies', label: he.tabs.replies, icon: '💬' },
  { id: 'notes', label: he.tabs.notes, icon: '📝' },
  { id: 'tags', label: he.tabs.tags, icon: '🏷️' },
  { id: 'customers', label: he.tabs.customers, icon: '👥' },
];

const SECONDARY: { id: TabId; label: string; icon: string }[] = [
  { id: 'history', label: he.tabs.history, icon: '📊' },
  { id: 'settings', label: he.tabs.settings, icon: '⚙️' },
  { id: 'admin', label: he.tabs.admin, icon: '🛡️' },
];

function TabButton({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: TabId;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      key={id}
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[64px] text-[11px] font-semibold rounded-xl transition-all duration-200',
        active
          ? 'text-notion-accent bg-notion-soft'
          : 'text-notion-muted hover:text-notion-text hover:bg-notion-surface2/60',
      )}
      dir="rtl"
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="leading-tight">{label}</span>
      {active && (
        <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-notion-accent" />
      )}
    </button>
  );
}

export function TabBar({ activeTab, onTabChange, showAdmin = false, totalLeads = 0 }: TabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const secondary = SECONDARY.filter((tab) => tab.id !== 'admin' || showAdmin);
  const secondaryActive = secondary.some((t) => t.id === activeTab);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen]);

  return (
    <div className="shrink-0 border-b border-notion-border bg-notion-bg/90 backdrop-blur-sm" dir="rtl">
      <div className="flex items-stretch gap-0.5 px-1.5 pt-1.5 pb-1">
        {PRIMARY.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}

        <div className="relative flex" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[56px] text-[11px] font-semibold rounded-xl transition-all duration-200',
              moreOpen || secondaryActive
                ? 'text-notion-accent bg-notion-soft'
                : 'text-notion-muted hover:text-notion-text hover:bg-notion-surface2/60',
            )}
          >
            <span className="text-sm leading-none">⋯</span>
            <span className="leading-tight">{he.tabs.more}</span>
            {(moreOpen || secondaryActive) && (
              <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-notion-accent" />
            )}
          </button>

          {moreOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-20 min-w-[148px] rounded-2xl wa-lh-glass p-1.5 space-y-0.5 shadow-notion-lg">
              {secondary.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl text-right transition-colors',
                    activeTab === tab.id
                      ? 'bg-notion-accent text-brand-mist'
                      : 'text-notion-muted hover:bg-notion-soft hover:text-notion-text',
                  )}
                >
                  <span>{tab.icon}</span>
                  <span className="flex-1">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {typeof totalLeads === 'number' && (
        <div className="flex items-center justify-between px-3 pb-2.5 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-notion-soft px-2 py-1 text-notion-accent font-bold tabular-nums">
            {totalLeads}
          </span>
          <span className="text-notion-muted font-medium">{he.sidebar.totalLeads}</span>
        </div>
      )}
    </div>
  );
}
