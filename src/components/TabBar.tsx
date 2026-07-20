import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/id';
import type { TabId } from '@/types';
import { he } from '@/i18n/he';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  showAdmin?: boolean;
  totalLeads?: number;
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconNotes({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

const PRIMARY: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'replies', label: he.tabs.replies, icon: <IconChat className="w-4 h-4" /> },
  { id: 'notes', label: he.tabs.notes, icon: <IconNotes className="w-4 h-4" /> },
  { id: 'tags', label: he.tabs.tags, icon: <IconTag className="w-4 h-4" /> },
  { id: 'customers', label: he.tabs.customers, icon: <IconUsers className="w-4 h-4" /> },
];

const SECONDARY: { id: TabId; label: string; icon: string }[] = [
  { id: 'history', label: he.tabs.history, icon: '📊' },
  { id: 'settings', label: he.tabs.settings, icon: '⚙️' },
  { id: 'admin', label: he.tabs.admin, icon: '🛡️' },
];

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-1 flex-col items-center justify-center gap-1 px-1.5 py-2.5 min-w-0 text-[10px] font-bold rounded-2xl transition-all duration-200',
        active
          ? 'text-brand-mist bg-notion-accent shadow-[0_6px_18px_rgba(0,173,181,0.35)] scale-[1.02]'
          : 'text-notion-muted hover:text-notion-text hover:bg-notion-surface2/80',
      )}
      dir="rtl"
    >
      <span className={cn('transition-transform duration-200', active && 'scale-110')}>{icon}</span>
      <span className="leading-tight truncate w-full text-center">{label}</span>
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
    <div className="shrink-0 px-2.5 pt-2 pb-2.5 border-b border-notion-border/80 bg-notion-bg/70 backdrop-blur-md overflow-visible" dir="rtl">
      <div className="relative flex items-stretch gap-1 p-1 rounded-[18px] bg-notion-surface/70 border border-notion-border shadow-[inset_0_1px_0_rgba(238,238,238,0.04)]" ref={menuRef}>
        {PRIMARY.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            'flex shrink-0 flex-col items-center justify-center gap-1 px-2.5 py-2.5 min-w-[52px] text-[10px] font-bold rounded-2xl transition-all duration-200',
            moreOpen || secondaryActive
              ? 'text-brand-ink bg-brand-mist shadow-glow-sm'
              : 'text-notion-muted hover:text-notion-text hover:bg-notion-surface2/80',
          )}
        >
          <IconMore className="w-4 h-4" />
          <span className="leading-tight">{he.tabs.more}</span>
        </button>

        {moreOpen && (
          <div className="absolute top-[calc(100%+6px)] inset-x-1 z-[60] rounded-2xl wa-lh-glass p-1.5 space-y-0.5 shadow-notion-lg border border-notion-accent/20">
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

      {typeof totalLeads === 'number' && (
        <div className="flex items-center justify-between px-1.5 pt-2.5 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold tabular-nums text-brand-mist wa-lh-accent-gradient shadow-[0_4px_12px_rgba(0,173,181,0.3)]">
            {totalLeads}
          </span>
          <span className="text-notion-muted font-medium tracking-wide">{he.sidebar.totalLeads}</span>
        </div>
      )}
    </div>
  );
}
