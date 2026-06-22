import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabBar } from '@/components/TabBar';
import { ToastContainer } from '@/components/Toast';
import { useContactData } from '@/hooks/useContactData';
import { useSettings } from '@/hooks/useSettings';
import { useTags } from '@/hooks/useStorageLists';
import { useToast } from '@/hooks/useToast';
import { applyThemeToElement } from '@/hooks/useTheme';
import { he } from '@/i18n/he';
import { CustomersPanel } from '@/pages/CustomersPanel';
import { HistoryPanel } from '@/pages/HistoryPanel';
import { NotesPanel } from '@/pages/NotesPanel';
import { QuickRepliesPanel } from '@/pages/QuickRepliesPanel';
import { RemindersPanel } from '@/pages/RemindersPanel';
import { SettingsPanel } from '@/pages/SettingsPanel';
import { TagsPanel } from '@/pages/TagsPanel';
import { initializeStorage } from '@/storage';
import type { DetectedContact, TabId } from '@/types';
import { getDetectedContactLabel } from '@/utils/contactDisplay';
import { getPrimaryTagColor, contactsReferToSamePerson } from '@/utils/contactMatch';
import { adjustWhatsAppLayout } from '@/utils/waDom';
import { isContactDataReady } from '@/components/ContactPanelGate';
import { ContactLoadingScreen } from '@/components/ContactLoadingScreen';

const CONTACT_TABS: TabId[] = ['notes', 'tags', 'replies', 'reminders'];
interface SidebarProps {
  contact: DetectedContact | null;
  listContact: DetectedContact | null;
  chatSwitching: boolean;
  onClose: () => void;
}

export function Sidebar({ contact, listContact, chatSwitching, onClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const { settings } = useSettings();

  const targetContact =
    listContact && contact && !contactsReferToSamePerson(listContact, contact)
      ? listContact
      : contact;

  const contactKey = targetContact?.phoneNumber ?? null;
  const { contact: contactData, loading: contactLoading, updateContact } = useContactData(
    contactKey,
    targetContact?.displayName,
  );
  const { tags } = useTags();
  const { toasts, showToast, dismissToast } = useToast();
  const sidebarRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) applyThemeToElement(node, settings.darkMode);
    },
    [settings.darkMode],
  );

  useEffect(() => {
    initializeStorage();
    adjustWhatsAppLayout(true, 350);
    return () => adjustWhatsAppLayout(false);
  }, []);

  useEffect(() => {
    const el = document.getElementById('wa-lead-helper-sidebar');
    if (el) applyThemeToElement(el, settings.darkMode);
  }, [settings.darkMode]);

  const handleUpdate = useCallback(
    async (updates: Parameters<typeof updateContact>[0]) => {
      return updateContact(updates);
    },
    [updateContact],
  );

  const panelKey = contactKey ?? 'none';

  const contactReady = isContactDataReady(targetContact, contactData, contactLoading);
  const isContactTab = CONTACT_TABS.includes(activeTab);
  const showContactLoading = Boolean(targetContact) && isContactTab && (chatSwitching || !contactReady);

  const primaryTagColor = useMemo(() => {
    if (!contactReady || !contactData) return null;
    return getPrimaryTagColor(contactData.tags, tags);
  }, [contactReady, contactData, tags]);

  return (
    <div
      id="wa-lead-helper-sidebar"
      ref={sidebarRef}
      className="fixed top-0 right-0 h-full w-[350px] z-[9999] flex flex-col font-heebo bg-notion-bg text-notion-text border-r border-notion-border shadow-notion-lg animate-slide-in dark:bg-notion-bg"
      dir="rtl"
      style={{ fontFamily: "'Heebo', 'Assistant', Arial, sans-serif" }}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-notion-border bg-notion-surface shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-notion-muted hover:bg-notion-border/50 hover:text-notion-text transition-colors"
          title={he.toggle.close}
          aria-label={he.toggle.close}
        >
          ✕
        </button>
        <div className="flex-1 text-right mr-2">
          <h1 className="text-base font-bold text-notion-text">{he.appName}</h1>
          {showContactLoading && isContactTab ? (
            <p className="text-xs text-notion-muted truncate">{he.contact.loadingDetails}</p>
          ) : targetContact ? (
            <p className="text-xs text-notion-muted truncate">
              {(() => {
                const { label, subtitle } = getDetectedContactLabel(
                  targetContact.phoneNumber,
                  targetContact.displayName,
                );
                const nameContent = (
                  <>
                    {label}
                    {subtitle && <span className="mr-1">({subtitle})</span>}
                  </>
                );
                if (primaryTagColor) {
                  return (
                    <span
                      className="wa-lh-contact-name-badge"
                      style={{ ['--wa-lh-tag-color' as string]: primaryTagColor }}
                    >
                      {nameContent}
                    </span>
                  );
                }
                return nameContent;
              })()}
            </p>
          ) : (
            <p className="text-xs text-notion-muted">{he.contact.noChat}</p>
          )}
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-notion-accent text-white text-sm font-bold shrink-0">
          WA
        </div>
      </header>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto wa-lh-scroll">
        {showContactLoading ? (
          <ContactLoadingScreen />
        ) : (
          <>
            {activeTab === 'notes' && (
              <NotesPanel
                key={panelKey}
                contact={contactData}
                detectedContact={targetContact}
                contactLoading={contactLoading}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === 'tags' && (
              <TagsPanel
                key={panelKey}
                contact={contactData}
                detectedContact={targetContact}
                contactLoading={contactLoading}
                onUpdate={handleUpdate}
                onToast={showToast}
              />
            )}
            {activeTab === 'replies' && (
              <QuickRepliesPanel
                key={panelKey}
                contact={contactData}
                onUpdate={handleUpdate}
                onToast={showToast}
              />
            )}
            {activeTab === 'reminders' && (
              <RemindersPanel
                key={panelKey}
                contact={contactData}
                detectedContact={targetContact}
                contactLoading={contactLoading}
                onUpdate={handleUpdate}
                onToast={showToast}
              />
            )}
            {activeTab === 'customers' && <CustomersPanel onToast={showToast} />}
            {activeTab === 'history' && <HistoryPanel />}
            {activeTab === 'settings' && (
              <SettingsPanel
                onToast={showToast}
                onThemeChange={(dark) => {
                  const el = document.getElementById('wa-lead-helper-sidebar');
                  if (el) applyThemeToElement(el, dark);
                }}
              />
            )}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
