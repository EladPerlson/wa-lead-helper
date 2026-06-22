import { ReminderView } from '@/components/ReminderView';

export function ReminderPopup() {
  const params = new URLSearchParams(window.location.search);
  const reminderId = params.get('id');

  if (!reminderId) {
    return null;
  }

  return <ReminderView reminderId={reminderId} mode="window" onClose={() => window.close()} />;
}
