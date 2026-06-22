import { cn } from '@/utils/id';
import type { TabId } from '@/types';
import { he } from '@/i18n/he';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'notes', label: he.tabs.notes, icon: '📝' },
  { id: 'tags', label: he.tabs.tags, icon: '🏷️' },
  { id: 'replies', label: he.tabs.replies, icon: '💬' },
  { id: 'reminders', label: he.tabs.reminders, icon: '⏰' },
  { id: 'customers', label: he.tabs.customers, icon: '👥' },
  { id: 'history', label: he.tabs.history, icon: '📊' },
  { id: 'settings', label: he.tabs.settings, icon: '⚙️' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-notion-surface border-b border-notion-border" dir="rtl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
            activeTab === tab.id
              ? 'bg-notion-accent text-white shadow-notion'
              : 'text-notion-muted hover:bg-notion-bg hover:text-notion-text',
          )}
          dir="rtl"
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
