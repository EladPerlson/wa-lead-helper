# WA Lead Helper

**עוזר לידים חכם ל-WhatsApp Web** — Chrome Extension (Manifest V3)

A production-ready Chrome extension for Israeli business owners to manage WhatsApp Web leads with notes, tags, quick replies, reminders, and contact history. **All UI is in Hebrew with full RTL support.**

---

## תכונות / Features

| תכונה | Feature |
|--------|---------|
| הערות עם שמירה אוטומטית | Notes with 1-second auto-save |
| תגיות צבעוניות (ברירת מחדל + מותאמות) | Colored tags (defaults + custom) |
| תשובות מוכנות עם הזרקה לצ'אט | Quick replies injected into WhatsApp input |
| תזכורות עם התראות Chrome | Reminders with Chrome notifications |
| היסטוריית לקוח | Contact history summary |
| הגדרות: מצב כהה, ייבוא/ייצוא | Settings: dark mode, import/export |

---

## התקנה / Installation

### דרישות / Requirements

- Node.js 18+
- Google Chrome

### פיתוח / Development

```bash
npm install
npm run dev
```

Load the extension from the `dist` folder Chrome creates during dev, or run a production build:

```bash
npm run build
```

### טעינה ב-Chrome / Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (מצב מפתח)
3. Click **Load unpacked** (טען תוסף ללא אריזה)
4. Select the **`dist`** folder from this project

### שימוש / Usage

1. Open [WhatsApp Web](https://web.whatsapp.com/)
2. Click the floating **💼** button (bottom-right)
3. Open any chat — the sidebar detects the contact automatically
4. Use tabs: **הערות**, **תגיות**, **תשובות**, **תזכורות**, **היסטוריה**, **הגדרות**

---

## מבנה הפרויקט / Project Structure

```
src/
  components/     # UI components (RTL, Hebrew)
  pages/          # Feature panels
  hooks/          # React hooks
  utils/          # WhatsApp DOM adapter, dates, phone parsing
  storage/        # chrome.storage.local layer
  types/          # TypeScript interfaces
  content/        # Content script + sidebar injection
  background/     # Service worker (alarms, notifications)
  popup/          # Extension popup
  i18n/he.ts      # All Hebrew strings
  styles/         # Tailwind + RTL globals
manifest.config.ts
vite.config.ts
```

---

## טכנולוגיות / Tech Stack

- React 18 + TypeScript
- TailwindCSS (Notion-inspired design)
- Vite + @crxjs/vite-plugin
- Chrome Manifest V3
- chrome.storage.local
- Supabase (הרשמה, התחברות וניהול משתמשים)

---

## זיהוי אנשי קשר / Contact Detection

WhatsApp Web does not always expose raw phone numbers in the DOM. The extension reads the active chat from URL hash, `data-id` attributes, and header text, then stores data keyed by the best available identifier.

---

## רישיון / License

Private — intended for commercial use by Israeli businesses.
