import { useCallback, useEffect, useState } from 'react';
import type { Tag, Template } from '@/types';
import { getStorageItem, setStorageItem, subscribeStorage } from '@/storage';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    getStorageItem('tags').then((t) => setTags(t ?? []));
    return subscribeStorage((changes) => {
      if (changes.tags) setTags(changes.tags);
    });
  }, []);

  const addTag = useCallback(async (tag: Tag) => {
    const current = (await getStorageItem('tags')) ?? [];
    const updated = [...current, tag];
    await setStorageItem('tags', updated);
    setTags(updated);
  }, []);

  const removeTag = useCallback(async (tagId: string) => {
    const current = (await getStorageItem('tags')) ?? [];
    const updated = current.filter((t) => t.id !== tagId);
    await setStorageItem('tags', updated);
    setTags(updated);
  }, []);

  return { tags, addTag, removeTag };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    getStorageItem('templates').then((t) => setTemplates(t ?? []));
    return subscribeStorage((changes) => {
      if (changes.templates) setTemplates(changes.templates);
    });
  }, []);

  const addTemplate = useCallback(async (template: Template) => {
    const current = (await getStorageItem('templates')) ?? [];
    const updated = [...current, template];
    await setStorageItem('templates', updated);
    setTemplates(updated);
  }, []);

  const removeTemplate = useCallback(async (templateId: string) => {
    const current = (await getStorageItem('templates')) ?? [];
    const updated = current.filter((t) => t.id !== templateId);
    await setStorageItem('templates', updated);
    setTemplates(updated);
  }, []);

  return { templates, addTemplate, removeTemplate };
}
