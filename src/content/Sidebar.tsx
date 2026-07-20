import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabBar } from '@/components/TabBar';
import { ToastContainer } from '@/components/Toast';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useContactData } from '@/hooks/useContactData';
import { useSettings } from '@/hooks/useSettings';
import { useTags } from '@/hooks/useStorageLists';
import { useToast } from '@/hooks/useToast';
import { applyThemeToElement } from '@/hooks/useTheme';
import { he } from '@/i18n/he';
import { AdminPanel } from '@/pages/AdminPanel';
import { CustomersPanel } from '@/pages/CustomersPanel';
import { HistoryPanel } from '@/pages/HistoryPanel';
import { NotesPanel } from '@/pages/NotesPanel';
import { QuickRepliesPanel } from '@/pages/QuickRepliesPanel';
import { SettingsPanel } from '@/pages/SettingsPanel';
import { TagsPanel } from '@/pages/TagsPanel';
import { initializeStorage } from '@/storage';
import type { DetectedContact, TabId } from '@/types';
import { getDetectedContactLabel } from '@/utils/contactDisplay';
import { getPrimaryTagColor, contactsReferToSamePerson } from '@/utils/contactMatch';
import { adjustWhatsAppLayout } from '@/utils/waDom';
import { isContactDataReady } from '@/components/ContactPanelGate';
import { ContactLoadingScreen } from '@/components/ContactLoadingScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { UpgradeModal, type UpgradeReason } from '@/components/UpgradeModal';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAllContacts } from '@/hooks/useAllContacts';
import { maybeRunAutoBackup } from '@/utils/backup';
import { syncContactsWithCloud } from '@/utils/cloudSync';
import { initSentryFromSettings } from '@/utils/sentry';
import { PANEL_WIDTH_PX } from './dock';

const CONTACT_TABS: TabId[] = ['notes', 'tags', 'replies'];

interface SidebarProps {
  contact: DetectedContact | null;
  listContact: DetectedContact | null;
  chatSwitching: boolean;
  onClose: () => void;
}

export function Sidebar({ contact, listContact, chatSwitching, onClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('replies');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>('generic');
  const { settings, updateSettings } = useSettings();
  const auth = useAuth();
  const subscription = useSubscription(auth.session);
  const { contacts } = useAllContacts();

  const requestUpgrade = useCallback((reason: UpgradeReason) => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  }, []);

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
    adjustWhatsAppLayout(true, PANEL_WIDTH_PX);
    void maybeRunAutoBackup();
    void initSentryFromSettings();
    return () => adjustWhatsAppLayout(false);
  }, []);

  useEffect(() => {
    if (auth.session && settings.cloudSyncEnabled) {
      void syncContactsWithCloud().catch(() => {
        // non-blocking
      });
    }
  }, [auth.session, settings.cloudSyncEnabled]);

  useEffect(() => {
    const el = document.getElementById('wa-lead-helper-sidebar');
    if (el) applyThemeToElement(el, settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    if (activeTab === 'admin' && !auth.isAdmin) {
      setActiveTab('replies');
    }
  }, [activeTab, auth.isAdmin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveTab('tags');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleUpdate = useCallback(
    async (updates: Parameters<typeof updateContact>[0]) => {
      return updateContact(updates);
    },
    [updateContact],
  );

  const toggleTheme = async () => {
    const next = !settings.darkMode;
    await updateSettings({ darkMode: next });
    const el = document.getElementById('wa-lead-helper-sidebar');
    if (el) applyThemeToElement(el, next);
  };

  const completeOnboarding = async () => {
    await updateSettings({ onboardingDone: true });
  };

  const panelKey = contactKey ?? 'none';
  const contactReady = isContactDataReady(targetContact, contactData, contactLoading);
  const isContactTab = CONTACT_TABS.includes(activeTab);
  const showContactLoading = Boolean(targetContact) && isContactTab && (chatSwitching || !contactReady);

  const primaryTagColor = useMemo(() => {
    if (!contactReady || !contactData) return null;
    return getPrimaryTagColor(contactData.tags, tags);
  }, [contactReady, contactData, tags]);

  const headerSubtitle = (() => {
    if (showContactLoading && isContactTab) return he.contact.loadingDetails;
    if (!targetContact) return he.contact.noChat;
    const { label, subtitle } = getDetectedContactLabel(
      targetContact.phoneNumber,
      targetContact.displayName,
    );
    const nameContent = (
      <>
        {label}
        {subtitle && <span className="mr-1 opacity-70">({subtitle})</span>}
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
  })();

  const showOnboarding = Boolean(auth.session) && settings.onboardingDone !== true;

  return (
    <div
      id="wa-lead-helper-sidebar"
      ref={sidebarRef}
      className="wa-lh-panel fixed top-0 right-0 h-full z-[9999] flex flex-col font-heebo text-notion-text border-l border-notion-border shadow-notion-lg animate-slide-in"
      dir="rtl"
      style={{
        fontFamily: "'Heebo', 'Outfit', Arial, sans-serif",
        width: `${PANEL_WIDTH_PX}px`,
      }}
    >
      <header className="flex items-center gap-2.5 px-3 py-3.5 shrink-0 border-b border-notion-border/80 bg-[#222831]/90 backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-notion-muted hover:bg-notion-surface hover:text-notion-text border border-notion-border/60 transition-colors"
          title={he.toggle.close}
          aria-label={he.toggle.close}
        >
          ✕
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-notion-muted hover:text-notion-accent hover:bg-notion-soft border border-notion-border/60 transition-colors"
          title={he.settings.darkMode}
          aria-label={he.settings.darkMode}
        >
          {settings.darkMode ? '☀' : '☾'}
        </button>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-2.5">
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-brand-mist wa-lh-brand tracking-wide">
                <span className="text-notion-accent">WA</span> Lead Helper
              </h1>
              <p className="text-[11px] text-notion-muted truncate mt-0.5">{headerSubtitle}</p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl wa-lh-accent-gradient text-[11px] font-black text-brand-mist shrink-0 shadow-[0_6px_16px_rgba(0,173,181,0.4)]">
              WA
            </span>
          </div>
        </div>
      </header>

      {auth.session && (
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showAdmin={auth.isAdmin}
          totalLeads={contacts.length}
        />
      )}

      <main className="flex-1 overflow-y-auto wa-lh-scroll min-h-0 relative">
        {auth.loading ? (
          <p className="text-sm text-notion-muted text-center pt-10">{he.common.loading}</p>
        ) : !auth.session ? (
          <AuthScreen auth={auth} />
        ) : showContactLoading ? (
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
                limits={subscription.limits}
                onUpdate={handleUpdate}
                onToast={showToast}
                onUpgradeNeeded={() => requestUpgrade('tags')}
              />
            )}
            {activeTab === 'replies' && (
              <QuickRepliesPanel
                key={panelKey}
                contact={contactData}
                limits={subscription.limits}
                subscription={subscription}
                onUpdate={handleUpdate}
                onToast={showToast}
                onUpgradeNeeded={(reason) => requestUpgrade(reason)}
              />
            )}
            {activeTab === 'customers' && <CustomersPanel onToast={showToast} />}
            {activeTab === 'history' && <HistoryPanel />}
            {activeTab === 'admin' && auth.isAdmin && <AdminPanel />}
            {activeTab === 'settings' && (
              <SettingsPanel
                auth={auth}
                subscription={subscription}
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
      <UpgradeModal
        open={upgradeOpen}
        reason={upgradeReason}
        userEmail={auth.session?.user?.email}
        onClose={() => setUpgradeOpen(false)}
      />
      <OnboardingModal open={showOnboarding} onComplete={() => void completeOnboarding()} />
    </div>
  );
}
