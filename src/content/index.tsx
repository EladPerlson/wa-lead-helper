import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from './Sidebar';
import { ToggleButton } from './ToggleButton';
import { ContextRefreshBanner } from './ContextRefreshBanner';
import { WaDomHealthBanner } from './WaDomHealthBanner';
import '@/styles/globals.css';
import type { ChatDetectionState, MessageType } from '@/types';
import { observeChatChanges, adjustWhatsAppLayout, openChatForContact } from '@/utils/waDom';
import { ChatAiOffer } from './ChatAiOffer';
import { startTagHighlighter } from './tagHighlighter';
import { handleChromeError, startContextWatcher } from '@/utils/extensionContext';
import { startWaDomHealthMonitor } from '@/utils/waDomHealth';
import { PANEL_WIDTH_PX } from './dock';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [contact, setContact] = useState<ChatDetectionState['contact']>(null);
  const [listContact, setListContact] = useState<ChatDetectionState['listContact']>(null);
  const [chatSwitching, setChatSwitching] = useState(false);

  useEffect(() => {
    return observeChatChanges(({ contact: detected, listContact: list, switching }) => {
      setContact(detected);
      setListContact(list);
      setChatSwitching(switching);
    });
  }, []);

  useEffect(() => {
    return startTagHighlighter();
  }, []);

  useEffect(() => {
    return startContextWatcher();
  }, []);

  useEffect(() => {
    return startWaDomHealthMonitor();
  }, []);

  useEffect(() => {
    adjustWhatsAppLayout(isOpen, PANEL_WIDTH_PX);
  }, [isOpen]);

  useEffect(() => {
    const listener = (message: MessageType) => {
      if (message.type === 'OPEN_CHAT') {
        openChatForContact(message.phoneNumber, message.displayName);
      }
    };

    try {
      chrome.runtime.onMessage.addListener(listener);
      return () => {
        try {
          chrome.runtime.onMessage.removeListener(listener);
        } catch {
          // extension context gone
        }
      };
    } catch (error) {
      handleChromeError(error);
      return undefined;
    }
  }, []);

  return (
    <>
      <ContextRefreshBanner />
      <WaDomHealthBanner />
      <ChatAiOffer />
      <ToggleButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />
      {isOpen && (
        <Sidebar
          contact={contact}
          listContact={listContact}
          chatSwitching={chatSwitching}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function mountExtension() {
  if (document.getElementById('wa-lead-helper-root')) return;

  const rootEl = document.createElement('div');
  rootEl.id = 'wa-lead-helper-root';
  document.body.appendChild(rootEl);

  createRoot(rootEl).render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountExtension);
} else {
  mountExtension();
}
