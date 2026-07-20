// הגדרות Supabase — יש למלא את שני הערכים מתוך לוח הבקרה של הפרויקט:
// Supabase Dashboard → Project Settings → API
export const SUPABASE_URL = 'https://dxcwydqevucijdllyfxf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Y3d5ZHFldnVjaWpkbGx5ZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODIzMjEsImV4cCI6MjA5ODY1ODMyMX0.w_DDVHpRjDNov3svSqOIGBNZElb8jAjMG6TVVFbTvCA';

// כתובות מייל שמוגדרות כאדמין — רק הן רואות את דף האדמין
export const ADMIN_EMAILS = ['eladtvil@gmail.com'];

// PayPal — https://developer.paypal.com/dashboard/applications
// חשוב: ה-Client ID חייב להיות מאותו חשבון PayPal Business שבו נוצרו המסלולים.
export const PAYPAL_CLIENT_ID =
  'AbnyYBk1O8qV-D0P2yYu9_LQDh5QopccdOvIYoBv1SPIZWNgbLHXG55pEQosOJzXLlbCUJ5VCMAscYN3';

/** כתובת SDK של PayPal (Live). לבדיקות Sandbox שנה ל-sandbox.paypal.com */
export const PAYPAL_SDK_BASE = 'https://www.paypal.com/sdk/js';

/** מזהי מסלולי מנוי חודשיים ב-PayPal (Subscriptions → Plans, מצב Active) */
export const PAYPAL_PLAN_IDS = {
  /** BASIC — ₪29/חודש */
  pro: 'P-5S302684SK139443NNJH645I',
  /** UNLIMITED — ₪99/חודש */
  unlimited: 'P-5NP7360783546560KNJH65MA',
} as const;

/**
 * מפתח OpenAI — אל תשמרו כאן מפתח אמיתי ב-git.
 * הגדירו מקומית או העבירו ל-Edge Function בפרודקשן.
 * מגבלות שימוש נאכפות ב-Supabase לפי מסלול.
 */
export const OPENAI_API_KEY = '';

/**
 * הגדרות חובה ב-Supabase Dashboard → Authentication → URL Configuration:
 *
 * Site URL:
 *   https://eladperlson.github.io/wa-lead-helper/reset.html
 *
 * Redirect URLs (הוסף את כולן):
 *   https://eladperlson.github.io/wa-lead-helper/reset.html
 *   https://eladperlson.github.io/wa-lead-helper/pricing.html
 *
 * בלי ההגדרות האלה Supabase מפנה ל-localhost:3000 וקישור איפוס הסיסמה נשבר.
 */
export const SUPABASE_SITE_URL = 'https://eladperlson.github.io/wa-lead-helper/reset.html';

export const SUPABASE_REDIRECT_URLS = [
  'https://eladperlson.github.io/wa-lead-helper/reset.html',
  'https://eladperlson.github.io/wa-lead-helper/pricing.html',
] as const;

/**
 * Optional Sentry DSN for error reporting. Leave empty to disable.
 * Can also be set per-user via settings.sentryDsn in extension storage.
 */
export const SENTRY_DSN = '';

