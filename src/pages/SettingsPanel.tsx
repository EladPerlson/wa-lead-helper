import { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Switch } from '@/components/Switch';
import { clearAllData, exportData, importData } from '@/storage';
import { PRIVACY_POLICY_URL } from '@/constants/urls';
import { he } from '@/i18n/he';
import { useSettings } from '@/hooks/useSettings';
import type { AuthState } from '@/hooks/useAuth';
import type { SubscriptionState } from '@/hooks/useSubscription';
import { PricingPanel } from '@/components/PricingPanel';
import { createLocalBackup, hasLocalBackup, restoreLocalBackup } from '@/utils/backup';
import { syncContactsWithCloud } from '@/utils/cloudSync';
import { formatDateHe } from '@/utils/date';

interface SettingsPanelProps {
  auth?: AuthState;
  subscription?: SubscriptionState;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onThemeChange: (darkMode: boolean) => void;
}

export function SettingsPanel({ auth, subscription, onToast, onThemeChange }: SettingsPanelProps) {
  const { settings, updateSettings } = useSettings();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDarkMode = async (checked: boolean) => {
    await updateSettings({ darkMode: checked });
    onThemeChange(checked);
  };

  const handleExport = async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wa-lead-helper-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onToast(he.settings.exportSuccess, 'success');
    } catch {
      onToast(he.common.error, 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      onToast(he.settings.importSuccess, 'success');
    } catch {
      onToast(he.settings.importError, 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAll = async () => {
    await clearAllData();
    setShowDeleteModal(false);
    onToast(he.settings.deleted, 'success');
  };

  const handleCloudSync = async () => {
    if (!auth?.session) return;
    setSyncing(true);
    try {
      await syncContactsWithCloud();
      onToast(he.settings.cloudSyncSuccess, 'success');
    } catch {
      onToast(he.settings.cloudSyncError, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      await createLocalBackup();
      onToast(he.settings.backupSuccess, 'success');
    } catch {
      onToast(he.common.error, 'error');
    }
  };

  const handleRestoreBackup = async () => {
    const ok = await hasLocalBackup();
    if (!ok) {
      onToast(he.settings.restoreEmpty, 'error');
      return;
    }
    try {
      const restored = await restoreLocalBackup();
      onToast(restored ? he.settings.restoreSuccess : he.settings.restoreEmpty, restored ? 'success' : 'error');
    } catch {
      onToast(he.common.error, 'error');
    }
  };

  return (
    <div className="p-4 space-y-4 animate-rise" dir="rtl">
      <h3 className="text-base font-bold text-notion-text text-right">{he.settings.title}</h3>

      {auth?.session && subscription && (
        <PricingPanel
          subscription={subscription}
          userEmail={auth.session.user.email}
        />
      )}

      {auth?.session && (
        <Card title={he.auth.account}>
          <div className="space-y-2">
            <p className="text-xs text-notion-muted text-right">
              {he.auth.loggedInAs}: <span dir="ltr">{auth.session.user.email}</span>
            </p>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => auth.signOut()}>
              🚪 {he.auth.logout}
            </Button>
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <Switch
          label={he.settings.darkMode}
          checked={settings.darkMode}
          onChange={handleDarkMode}
        />
        <Switch
          label={he.settings.showChatAiOffer}
          checked={settings.showChatAiOffer !== false}
          onChange={(checked) => void updateSettings({ showChatAiOffer: checked })}
        />
        <p className="text-xs text-notion-muted text-right -mt-1">
          {he.settings.showChatAiOfferHint}
        </p>
      </Card>

      {auth?.session && (
        <Card title={he.settings.cloudSync}>
          <div className="space-y-3">
            <Switch
              label={he.settings.cloudSync}
              checked={settings.cloudSyncEnabled === true}
              onChange={(checked) => void updateSettings({ cloudSyncEnabled: checked })}
            />
            <p className="text-xs text-notion-muted text-right">{he.settings.cloudSyncHint}</p>
            <Button
              variant="secondary"
              className="w-full"
              disabled={syncing || !settings.cloudSyncEnabled}
              onClick={() => void handleCloudSync()}
            >
              {syncing ? he.common.loading : he.settings.cloudSyncNow}
            </Button>
          </div>
        </Card>
      )}

      <Card title={he.settings.autoBackup}>
        <div className="space-y-3">
          <p className="text-xs text-notion-muted text-right">{he.settings.autoBackupHint}</p>
          {settings.lastBackupAt && (
            <p className="text-xs text-notion-muted text-right">
              {he.settings.lastBackup}: {formatDateHe(settings.lastBackupAt)}
            </p>
          )}
          <Button variant="secondary" className="w-full" onClick={() => void handleBackupNow()}>
            {he.settings.backupNow}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => void handleRestoreBackup()}>
            {he.settings.restoreBackup}
          </Button>
        </div>
      </Card>

      <Card title={he.settings.shortcuts}>
        <p className="text-xs text-notion-muted text-right leading-relaxed">
          {he.settings.shortcutsBody}
        </p>
      </Card>

      <Card className="space-y-3">
        <Button variant="secondary" className="w-full" onClick={handleExport}>
          📤 {he.settings.export}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
          📥 {he.settings.import}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImport}
        />
      </Card>

      <Card>
        <Button variant="danger" className="w-full" onClick={() => setShowDeleteModal(true)}>
          🗑️ {he.settings.deleteAll}
        </Button>
      </Card>

      <Card>
        <a
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-sm text-notion-accent hover:underline py-1"
        >
          🔒 {he.settings.privacyPolicy}
        </a>
      </Card>

      <Modal
        open={showDeleteModal}
        title={he.settings.deleteConfirmTitle}
        message={he.settings.deleteConfirmMessage}
        confirmLabel={he.settings.deleteConfirm}
        cancelLabel={he.settings.cancel}
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />
    </div>
  );
}
