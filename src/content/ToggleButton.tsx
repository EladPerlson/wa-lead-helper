import { he } from '@/i18n/he';

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
      className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-2xl bg-notion-accent text-white shadow-notion-lg flex items-center justify-center text-xl font-bold transition-all duration-300 hover:bg-notion-accentHover hover:scale-105 focus:outline-none focus:ring-4 focus:ring-notion-accent/30 wa-lh-pulse"
      style={{
        fontFamily: "'Heebo', 'Assistant', Arial, sans-serif",
        ...(isOpen ? { right: '370px' } : {}),
      }}
      title={isOpen ? he.toggle.close : he.toggle.open}
      aria-label={isOpen ? he.toggle.close : he.toggle.open}
      dir="rtl"
    >
      {isOpen ? '✕' : '💼'}
    </button>
  );
}
