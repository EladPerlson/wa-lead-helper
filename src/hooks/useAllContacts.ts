import { useEffect, useState } from 'react';
import { getStorageItem, subscribeStorage } from '@/storage';
import type { ContactData } from '@/types';
import { shouldShowInContactList } from '@/utils/contactDisplay';

export function useAllContacts() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeList = (map: Record<string, ContactData>) =>
    Object.values(map)
      .filter(shouldShowInContactList)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    const load = async () => {
      const map = (await getStorageItem('contacts')) ?? {};
      setContacts(normalizeList(map));
      setLoading(false);
    };

    load();
    return subscribeStorage((changes) => {
      if (changes.contacts) {
        setContacts(normalizeList(changes.contacts));
      }
    });
  }, []);

  return { contacts, loading };
}
