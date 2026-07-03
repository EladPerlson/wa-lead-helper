import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

const PRIVACY_POLICY_URL = 'https://eladperlson.github.io/wa-lead-helper/privacy.html';

export default defineManifest({
  manifest_version: 3,
  name: 'WA Lead Helper',
  description: 'עוזר לידים ל-WhatsApp Web - ניהול לקוחות, הערות, תגיות ותזכורות',
  version: packageJson.version,
  homepage_url: PRIVACY_POLICY_URL,
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  action: {
    default_popup: 'index.html',
    default_title: 'WA Lead Helper',
    default_icon: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
    },
  },
  permissions: ['storage'],
  host_permissions: ['https://web.whatsapp.com/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://web.whatsapp.com/*'],
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['icons/*'],
      matches: ['https://web.whatsapp.com/*'],
    },
  ],
});
