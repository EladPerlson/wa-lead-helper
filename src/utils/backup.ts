import { exportData, getStorageItem, importData, setStorageItem } from '@/storage';
import type { Settings } from '@/types';

const BACKUP_KEY = 'wa_lh_auto_backup_json';
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function createLocalBackup(): Promise<string> {
  const json = await exportData();
  try {
    localStorage.setItem(BACKUP_KEY, json);
  } catch {
    // quota / private mode — still update timestamp attempt
  }
  const settings: Settings = (await getStorageItem('settings')) ?? { darkMode: true };
  await setStorageItem('settings', {
    ...settings,
    lastBackupAt: new Date().toISOString(),
  });
  return json;
}

export async function restoreLocalBackup(): Promise<boolean> {
  let json: string | null = null;
  try {
    json = localStorage.getItem(BACKUP_KEY);
  } catch {
    return false;
  }
  if (!json) return false;
  await importData(json);
  return true;
}

export async function hasLocalBackup(): Promise<boolean> {
  try {
    return Boolean(localStorage.getItem(BACKUP_KEY));
  } catch {
    return false;
  }
}

/** Run backup if last one is older than 24h (or never). */
export async function maybeRunAutoBackup(): Promise<void> {
  const settings = (await getStorageItem('settings')) ?? { darkMode: true };
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : 0;
  if (Date.now() - last < BACKUP_INTERVAL_MS) return;
  try {
    await createLocalBackup();
  } catch {
    // ignore
  }
}
