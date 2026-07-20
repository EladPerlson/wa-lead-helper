import type { ContactData } from '@/types';
import { getAllContacts, getStorageItem, setStorageItem } from '@/storage';
import { supabase } from '@/supabase/client';
import { captureException } from '@/utils/sentry';

/**
 * Bidirectional merge of local contacts with Supabase `user_contacts`.
 * Requires schema migration (see supabase/schema.sql) and cloudSyncEnabled.
 */
export async function syncContactsWithCloud(): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { pushed: 0, pulled: 0 };

  const userId = session.user.id;
  const localList = await getAllContacts();
  const localMap = new Map(localList.map((c) => [c.phoneNumber, c]));

  const { data: remoteRows, error: pullError } = await supabase
    .from('user_contacts')
    .select('phone_number, payload, updated_at')
    .eq('user_id', userId);

  if (pullError) {
    captureException(pullError);
    throw pullError;
  }

  let pulled = 0;
  const remoteByPhone = new Map<string, { payload: ContactData; updated_at: string }>();

  for (const row of remoteRows ?? []) {
    const payload = row.payload as ContactData;
    if (!payload?.phoneNumber) continue;
    remoteByPhone.set(row.phone_number, {
      payload: { ...payload, phoneNumber: row.phone_number },
      updated_at: row.updated_at,
    });
  }

  // Merge remote → local (remote wins if newer by updated_at vs local createdAt as proxy)
  const contacts = (await getStorageItem('contacts')) ?? {};
  for (const [phone, remote] of remoteByPhone) {
    const local = localMap.get(phone);
    if (!local) {
      contacts[phone] = remote.payload;
      pulled += 1;
      continue;
    }
    const localTs = new Date(local.createdAt).getTime();
    const remoteTs = new Date(remote.updated_at).getTime();
    // Prefer the side with more notes/tags if timestamps are close; else newer remote
    if (remoteTs > localTs + 1000) {
      contacts[phone] = { ...local, ...remote.payload, phoneNumber: phone };
      pulled += 1;
    }
  }
  await setStorageItem('contacts', contacts);

  // Push all local (after merge) upsert
  const merged = Object.values(contacts);
  if (merged.length === 0) return { pushed: 0, pulled };

  const rows = merged.map((c) => ({
    user_id: userId,
    phone_number: c.phoneNumber,
    payload: c,
    updated_at: new Date().toISOString(),
  }));

  const { error: pushError } = await supabase.from('user_contacts').upsert(rows, {
    onConflict: 'user_id,phone_number',
  });

  if (pushError) {
    captureException(pushError);
    throw pushError;
  }

  return { pushed: rows.length, pulled };
}
