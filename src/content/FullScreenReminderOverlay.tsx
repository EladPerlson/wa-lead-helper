import { createPortal } from 'react-dom';
import { ReminderView } from '@/components/ReminderView';

interface FullScreenReminderOverlayProps {
  reminderId: string;
  onClose: () => void;
}

export function FullScreenReminderOverlay({ reminderId, onClose }: FullScreenReminderOverlayProps) {
  return createPortal(
    <ReminderView reminderId={reminderId} mode="overlay" onClose={onClose} />,
    document.body,
  );
}
