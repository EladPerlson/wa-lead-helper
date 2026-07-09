// הגדרות Supabase — יש למלא את שני הערכים מתוך לוח הבקרה של הפרויקט:
// Supabase Dashboard → Project Settings → API
export const SUPABASE_URL = 'https://dxcwydqevucijdllyfxf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Y3d5ZHFldnVjaWpkbGx5ZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODIzMjEsImV4cCI6MjA5ODY1ODMyMX0.w_DDVHpRjDNov3svSqOIGBNZElb8jAjMG6TVVFbTvCA';

// כתובות מייל שמוגדרות כאדמין — רק הן רואות את דף האדמין
export const ADMIN_EMAILS = ['eladtvil@gmail.com'];

// PayPal — מלא אחרי יצירת אפליקציה ומסלולי מנוי ב-PayPal Developer Dashboard
// https://developer.paypal.com/dashboard/applications
export const PAYPAL_CLIENT_ID = 'Aefglr47qDDdJYbqXwDyddCtkICbf67GI_T9KX52BAdsdXeLv2ifni4fKlpLxpeWtvQYn8JIWUmZEZWx';

/** מזהי מסלולי מנוי חודשיים ב-PayPal (Subscriptions → Plans) */
export const PAYPAL_PLAN_IDS = {
  pro: 'P-5S302684SK139443NNJH645I',
  unlimited: 'P-5NP7360783546560KNJH65MA',
} as const;

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
