import type { ContactData, LeadStatus } from '@/types';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'following', 'closed'];

export function getLeadStatus(contact: Pick<ContactData, 'status'> | null | undefined): LeadStatus {
  return contact?.status ?? 'new';
}

export function isHotLead(contact: ContactData): boolean {
  return contact.tags.includes('hot-lead');
}

export function needsFollowUp(contact: ContactData): boolean {
  if (getLeadStatus(contact) === 'following') return true;
  return contact.tags.includes('follow-up');
}

export function isUntagged(contact: ContactData): boolean {
  return contact.tags.length === 0 && getLeadStatus(contact) === 'new';
}
