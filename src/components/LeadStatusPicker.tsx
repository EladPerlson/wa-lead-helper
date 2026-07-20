import { Button } from '@/components/Button';
import { he } from '@/i18n/he';
import type { LeadStatus } from '@/types';
import { LEAD_STATUSES, getLeadStatus } from '@/utils/leadStatus';
import { cn } from '@/utils/id';

interface LeadStatusPickerProps {
  status?: LeadStatus;
  onChange: (status: LeadStatus) => void;
  compact?: boolean;
}

function labelFor(status: LeadStatus): string {
  switch (status) {
    case 'following':
      return he.leadStatus.following;
    case 'closed':
      return he.leadStatus.closed;
    default:
      return he.leadStatus.new;
  }
}

function tone(status: LeadStatus): string {
  switch (status) {
    case 'following':
      return 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'closed':
      return 'border-slate-400/50 bg-slate-500/10 text-slate-600 dark:text-slate-300';
    default:
      return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }
}

export function LeadStatusPicker({ status, onChange, compact }: LeadStatusPickerProps) {
  const current = getLeadStatus({ status });

  return (
    <div className="space-y-2" dir="rtl">
      {!compact && (
        <p className="text-xs font-medium text-notion-muted text-right">{he.leadStatus.title}</p>
      )}
      <div className="flex flex-wrap gap-1.5 justify-end">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-lg border transition-all',
              current === s
                ? tone(s)
                : 'border-notion-border text-notion-muted hover:bg-notion-soft hover:text-notion-text',
            )}
          >
            {labelFor(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Compact row of status buttons for denser UIs. */
export function LeadStatusButtons({
  status,
  onChange,
}: {
  status?: LeadStatus;
  onChange: (status: LeadStatus) => void;
}) {
  return (
    <div className="flex gap-1 justify-end">
      {LEAD_STATUSES.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={getLeadStatus({ status }) === s ? 'primary' : 'ghost'}
          onClick={() => onChange(s)}
        >
          {labelFor(s)}
        </Button>
      ))}
    </div>
  );
}
