import { he } from '@/i18n/he';
import type { ContactData, DetectedContact } from '@/types';
import type { ReactNode } from 'react';
import { contactKeysMatch } from '@/utils/phone';
import { ContactLoadingScreen } from '@/components/ContactLoadingScreen';

interface ContactPanelGateProps {
  detectedContact: DetectedContact | null;
  contact: ContactData | null;
  contactLoading?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function isContactDataReady(
  detectedContact: DetectedContact | null,
  contact: ContactData | null,
  contactLoading?: boolean,
): boolean {
  if (!detectedContact || contactLoading) return false;
  if (!contact) return false;
  return contactKeysMatch(contact.phoneNumber, detectedContact.phoneNumber);
}

export function ContactPanelGate({
  detectedContact,
  contact,
  contactLoading,
  emptyMessage = he.contact.openChat,
  children,
}: ContactPanelGateProps) {
  if (!detectedContact) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]" dir="rtl">
        <div className="w-14 h-14 rounded-3xl bg-notion-soft text-notion-accent flex items-center justify-center text-2xl wa-lh-glow-ring">
          💬
        </div>
        <p className="text-sm text-notion-muted leading-relaxed max-w-[220px]">{emptyMessage}</p>
      </div>
    );
  }

  if (!isContactDataReady(detectedContact, contact, contactLoading)) {
    return <ContactLoadingScreen />;
  }

  return <>{children}</>;
}