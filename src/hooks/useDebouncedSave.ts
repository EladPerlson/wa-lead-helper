import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDebouncedSaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delay?: number;
  /** When this changes, pending debounced saves for the previous id are cancelled */
  saveTargetId?: string;
}

export function useDebouncedSave<T>({
  value,
  onSave,
  delay = 1000,
  saveTargetId,
}: UseDebouncedSaveOptions<T>) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isFirstRender = useRef(true);
  const onSaveRef = useRef(onSave);
  const targetIdRef = useRef(saveTargetId);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<{ id: string; value: T } | null>(null);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    targetIdRef.current = saveTargetId;
  }, [saveTargetId]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    cancel();
    const pending = pendingValueRef.current;
    if (!pending || !targetIdRef.current || pending.id !== targetIdRef.current) {
      pendingValueRef.current = null;
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await onSaveRef.current(pending.value);
      if (pending.id === targetIdRef.current) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
      pendingValueRef.current = null;
    }
  }, [cancel]);

  const scheduleSave = useCallback(
    (val: T, id: string) => {
      cancel();
      pendingValueRef.current = { id, value: val };

      timeoutRef.current = setTimeout(async () => {
        const pending = pendingValueRef.current;
        if (!pending || pending.id !== targetIdRef.current) return;

        setSaving(true);
        setSaved(false);
        try {
          await onSaveRef.current(pending.value);
          if (pending.id === targetIdRef.current) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }
        } finally {
          setSaving(false);
          pendingValueRef.current = null;
        }
      }, delay);
    },
    [cancel, delay],
  );

  useEffect(() => {
    if (!saveTargetId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    scheduleSave(value, saveTargetId);
  }, [value, saveTargetId, scheduleSave]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [saveTargetId, cancel]);

  const saveNow = useCallback(async () => {
    cancel();
    if (!saveTargetId) return;

    setSaving(true);
    setSaved(false);
    try {
      await onSaveRef.current(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
      pendingValueRef.current = null;
    }
  }, [value, saveTargetId, cancel]);

  return { saving, saved, saveNow, cancel, flush };
}
