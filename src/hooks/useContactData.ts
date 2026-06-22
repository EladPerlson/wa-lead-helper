import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContactData } from '@/types';
import { createEmptyContact, getContact, saveContact, subscribeStorage } from '@/storage';
import { pickDisplayNameForSave } from '@/utils/contactDisplay';
import { contactKeysMatch } from '@/utils/phone';

export function useContactData(phoneNumber: string | null, displayName?: string) {
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(false);
  const loadIdRef = useRef(0);

  const loadContact = useCallback(async () => {
    if (!phoneNumber) {
      setContact(null);
      setLoading(false);
      return;
    }

    const loadId = ++loadIdRef.current;
    setLoading(true);

    try {
      const data = await createEmptyContact(phoneNumber, displayName);
      if (loadId !== loadIdRef.current) return;

      const resolvedName = pickDisplayNameForSave(displayName, data.displayName);
      if (resolvedName !== data.displayName) {
        const updated = { ...data, displayName: resolvedName };
        await saveContact(updated);
        setContact(updated);
      } else {
        setContact(data);
      }
    } finally {
      if (loadId === loadIdRef.current) {
        setLoading(false);
      }
    }
  }, [phoneNumber, displayName]);

  useEffect(() => {
    // Clear stale data and invalidate any in-flight load the moment the key changes.
    loadIdRef.current += 1;
    setContact(null);
    setLoading(Boolean(phoneNumber));
  }, [phoneNumber]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  useEffect(() => {
    if (!phoneNumber) return;

    return subscribeStorage((changes) => {
      if (!changes.contacts) return;

      const exact = changes.contacts[phoneNumber];
      if (exact && contactKeysMatch(exact.phoneNumber, phoneNumber)) {
        setContact(exact);
        return;
      }

      for (const candidate of Object.values(changes.contacts)) {
        if (contactKeysMatch(candidate.phoneNumber, phoneNumber)) {
          setContact(candidate);
          return;
        }
      }
    });
  }, [phoneNumber]);

  const updateContact = useCallback(
    async (updates: Partial<Omit<ContactData, 'phoneNumber'>>) => {
      if (!phoneNumber) return null;

      const current = (await getContact(phoneNumber)) ?? (await createEmptyContact(phoneNumber, displayName));
      const updated: ContactData = { ...current, ...updates, phoneNumber };
      await saveContact(updated);
      setContact(updated);
      return updated;
    },
    [phoneNumber, displayName],
  );

  return { contact, loading, updateContact, reload: loadContact };
}
