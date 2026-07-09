# הגדרת כתובות Auth ב-Supabase

אם קישור איפוס סיסמה מוביל ל-`http://localhost:3000` — ההגדרות ב-Supabase לא נכונות.

## שלבים

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט → **Authentication** → **URL Configuration**

### Site URL

החלף את `http://localhost:3000` ב:

```
https://eladperlson.github.io/wa-lead-helper/reset.html
```

### Redirect URLs

הוסף את שתי הכתובות הבאות (לחץ **Add URL** לכל אחת):

```
https://eladperlson.github.io/wa-lead-helper/reset.html
https://eladperlson.github.io/wa-lead-helper/pricing.html
```

3. לחץ **Save**

## בדיקה

1. בתוסף לחץ **שכחת סיסמה?**
2. פתח את המייל מ-Supabase
3. הקישור צריך להתחיל ב-`https://eladperlson.github.io/wa-lead-helper/reset.html#...`
   ולא ב-`localhost:3000`

## פתרון זמני (אם כבר קיבלת מייל עם localhost)

העתק את החלק אחרי ה-`#` מהקישור השבור, והדבק בסוף:

```
https://eladperlson.github.io/wa-lead-helper/reset.html#
```

לדוגמה:

```
https://eladperlson.github.io/wa-lead-helper/reset.html#access_token=...&type=recovery
```
