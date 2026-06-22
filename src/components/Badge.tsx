import { cn } from '@/utils/id';

interface BadgeProps {
  label: string;
  color?: string;
  emoji?: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function Badge({
  label,
  color = '#6b7280',
  emoji,
  active = false,
  onClick,
  onRemove,
  className,
}: BadgeProps) {
  const isInteractive = Boolean(onClick);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full',
        'transition-all duration-200 border',
        isInteractive && 'cursor-pointer hover:scale-105',
        active ? 'ring-2 ring-offset-1 ring-current' : 'opacity-80 hover:opacity-100',
        className,
      )}
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}60`,
        color: color,
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
