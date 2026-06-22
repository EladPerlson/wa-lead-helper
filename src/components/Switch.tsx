import { cn } from '@/utils/id';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer" dir="rtl">
      <span className="text-sm font-medium text-notion-text">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-notion-accent' : 'bg-notion-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            checked ? 'left-0.5' : 'left-[22px]',
          )}
        />
      </button>
    </label>
  );
}
