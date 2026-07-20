# הגדרת OpenAI (מפתח בעל המערכת)

המפתח הוא שלך בלבד. המשתמשים לא מזינים מפתח — הם צורכים קרדיטים לפי מסלול.

## מגבלות לפי מסלול

| מסלול | הצעות AI |
|--------|-----------|
| חינמי | **ניסיון אחד** (לכל החיים במסלול החינמי) |
| בסיסי ₪29 | **30 בחודש** |
| ללא הגבלה ₪99 | **ללא הגבלה** |

## שלב 1 — SQL ב-Supabase

הרץ את `supabase/schema.sql` (כולל `consume_ai_credit`, `get_ai_usage`, `refund_ai_credit`).

## שלב 2 — מפתח OpenAI בתוסף

בקובץ `src/supabase/config.ts` מלא:

```ts
export const OPENAI_API_KEY = 'sk-...';
```

ואז:

```bash
npm run build
```

טען מחדש את התוסף מתיקיית `dist`.

> הערה: המפתח נכנס ל-bundle של התוסף. לשימוש מסחרי רחב עדיף Edge Function עם Secret ב-Supabase.
