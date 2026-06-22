type InvalidateListener = () => void;

const listeners = new Set<InvalidateListener>();
let invalidated = false;

export function isContextInvalidatedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Extension context invalidated') ||
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection')
  );
}

export function isExtensionContextValid(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

export function isContextInvalidated(): boolean {
  return invalidated || !isExtensionContextValid();
}

export function markContextInvalidated(): void {
  if (invalidated) return;
  invalidated = true;
  listeners.forEach((fn) => fn());
}

export function onContextInvalidated(listener: InvalidateListener): () => void {
  listeners.add(listener);
  if (invalidated) listener();
  return () => listeners.delete(listener);
}

export function handleChromeError(error: unknown): void {
  if (isContextInvalidatedError(error) || !isExtensionContextValid()) {
    markContextInvalidated();
  }
}

export async function safeRuntimeSendMessage<T = unknown>(message: unknown): Promise<T | null> {
  if (isContextInvalidated()) {
    markContextInvalidated();
    return null;
  }

  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch (error) {
    handleChromeError(error);
    return null;
  }
}

export async function safeStorageGet(
  keys: string | string[] | Record<string, unknown> | null,
): Promise<Record<string, unknown>> {
  if (isContextInvalidated()) {
    markContextInvalidated();
    return {};
  }

  try {
    return await chrome.storage.local.get(keys);
  } catch (error) {
    handleChromeError(error);
    return {};
  }
}

export async function safeStorageSet(items: Record<string, unknown>): Promise<boolean> {
  if (isContextInvalidated()) {
    markContextInvalidated();
    return false;
  }

  try {
    await chrome.storage.local.set(items);
    return true;
  } catch (error) {
    handleChromeError(error);
    return false;
  }
}

export async function safeStorageClear(): Promise<boolean> {
  if (isContextInvalidated()) {
    markContextInvalidated();
    return false;
  }

  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    handleChromeError(error);
    return false;
  }
}

export function startContextWatcher(): () => void {
  const interval = setInterval(() => {
    if (!isExtensionContextValid()) {
      markContextInvalidated();
    }
  }, 3000);

  return () => clearInterval(interval);
}
