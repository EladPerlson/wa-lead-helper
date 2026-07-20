export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
  createdAt: string;
  phoneNumber: string;
}

/** Explicit lead pipeline status (in addition to free-form tags). */
export type LeadStatus = 'new' | 'following' | 'closed';

export interface ContactData {
  phoneNumber: string;
  displayName?: string;
  notes: string;
  tags: string[];
  /** Pipeline status — defaults to 'new' when missing (legacy contacts). */
  status?: LeadStatus;
  createdAt: string;
  reminders: Reminder[];
  templatesUsed: number;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
  emoji?: string;
}

export interface Template {
  id: string;
  text: string;
  createdAt: string;
}

export interface Settings {
  darkMode: boolean;
  /** Show floating "reply with AI?" offer above the chat composer */
  showChatAiOffer?: boolean;
  reminderNotificationsDate?: string;
  reminderNotificationsCount?: number;
  cachedPlan?: 'free' | 'pro' | 'unlimited';
  /** First-time onboarding wizard completed */
  onboardingDone?: boolean;
  /** Last automatic local backup ISO timestamp */
  lastBackupAt?: string;
  /** Push/pull contacts to Supabase when signed in */
  cloudSyncEnabled?: boolean;
  /** Optional Sentry DSN — errors only captured when set */
  sentryDsn?: string;
}

export interface StorageSchema {
  contacts: Record<string, ContactData>;
  tags: Tag[];
  templates: Template[];
  settings: Settings;
}

export type TabId =
  | 'notes'
  | 'tags'
  | 'replies'
  | 'history'
  | 'customers'
  | 'settings'
  | 'admin';

export interface DetectedContact {
  phoneNumber: string;
  displayName: string;
}

export interface ChatDetectionState {
  contact: DetectedContact | null;
  listContact: DetectedContact | null;
  switching: boolean;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  data: StorageSchema;
}

export type MessageType =
  | { type: 'OPEN_CHAT'; phoneNumber: string; displayName?: string };

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
