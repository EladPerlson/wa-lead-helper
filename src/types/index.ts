export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
  createdAt: string;
  phoneNumber: string;
}

export interface ContactData {
  phoneNumber: string;
  displayName?: string;
  notes: string;
  tags: string[];
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
  reminderNotificationsDate?: string;
  reminderNotificationsCount?: number;
  cachedPlan?: 'free' | 'pro' | 'unlimited';
}

export interface StorageSchema {
  contacts: Record<string, ContactData>;
  tags: Tag[];
  templates: Template[];
  settings: Settings;
}

export type TabId = 'notes' | 'tags' | 'replies' | 'reminders' | 'history' | 'customers' | 'settings' | 'admin';

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
