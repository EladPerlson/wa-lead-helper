import { cn } from '@/utils/id';

interface BadgeProps {
  label: string;
  color?: string;
  emoji?: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  count?: number;
}

export function Badge({
  label,
  color = '#00ADB5',
  emoji,
  active = false,
  onClick,
  onRemove,
  className,
  count,
}: BadgeProps) {
  const isInteractive = Boolean(onClick);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-2xl',
        'transition-all duration-200 border',
        isInteractive && 'cursor-pointer hover:scale-[1.03]',
        active
          ? 'ring-2 ring-offset-2 ring-offset-notion-bg shadow-glow-sm'
          : 'opacity-85 hover:opacity-100',
        className,
      )}
      style={{
        backgroundColor: `${color}22`,
        borderColor: active ? color : `${color}55`,
        color,
        ['--tw-ring-color' as string]: color,
      }}
      onClick={onClick}
      dir="rtl"
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className="min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {count}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mr-0.5 hover:opacity-70 text-[10px] leading-none"
          aria-label="הסר"
        >
          ✕
        </button>
      )}
    </span>
  );
}
