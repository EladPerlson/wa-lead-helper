import { he } from '@/i18n/he';
import { PANEL_WIDTH_PX } from './dock';

interface ToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ToggleButton({ isOpen, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      id="wa-lead-helper-toggle"
      onClick={onClick}
      className="fixed bottom-6 z-[9998] w-12 h-12 rounded-[14px] wa-lh-accent-gradient text-brand-mist shadow-[0_10px_28px_rgba(0,173,181,0.35)] flex items-center justify-center text-lg font-bold transition-all duration-300 hover:brightness-110 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-notion-accent/25"
      style={{
        fontFamily: "'Heebo', 'Outfit', Arial, sans-serif",
        right: isOpen ? `${PANEL_WIDTH_PX + 16}px` : '24px',
      }}
      title={isOpen ? he.toggle.close : he.toggle.open}
      aria-label={isOpen ? he.toggle.close : he.toggle.open}
      dir="rtl"
    >
      {isOpen ? '✕' : 'WA'}
    </button>
  );
}
