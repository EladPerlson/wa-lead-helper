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
      <div className="p-4 text-sm text-notion-muted text-right" dir="rtl">
        {emptyMessage}
      </div>
    );
  }

  if (!isContactDataReady(detectedContact, contact, contactLoading)) {
    return <ContactLoadingScreen />;
  }

  return <>{children}</>;
}