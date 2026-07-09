# הגדרת PayPal למנויים

אם חלון התשלום נפתח לשנייה ונסגר — בדוק את הנקודות הבאות.

## 1. מסלולים פעילים (ACTIVE)

ב-PayPal Dashboard → **Subscriptions** → **Plans**:

- ודא ששני המסלולים במצב **Active** (לא Draft / Inactive)
- המטבע: **ILS** (שקל)
- המחירים: ₪29 ו-₪99

## 2. Live מול Sandbox

ה-Client ID בקוד הוא **Live** (לא Sandbox).

- מזהי המסלולים (`P-5S30...`, `P-5NP7...`) חייבים להיות ממסלולי **Live**
- אם יצרת מסלולים ב-Sandbox, צריך Client ID של Sandbox ומזהי מסלול אחרים

## שגיאת RESOURCE_NOT_FOUND / INVALID_RESOURCE_ID

המזהים בקוד לא תואמים למסלולים ב-PayPal Live שלך.

### איך למצוא את Plan ID הנכון

1. היכנס ל-[PayPal.com](https://www.paypal.com) (לא Sandbox)
2. **Settings** → **Account Settings** → **Products and Services** → **Subscriptions**
   (או: PayPal Dashboard → Billing → Subscriptions → Plans)
3. לחץ על המסלול (₪29 או ₪99)
4. העתק את **Plan ID** (מתחיל ב-`P-`)
5. עדכן ב-`src/supabase/config.ts` וב-`docs/pricing.html`:

```ts
export const PAYPAL_PLAN_IDS = {
  pro: 'P-XXXXXXXX',      // מסלול ₪29
  unlimited: 'P-YYYYYYYY', // מסלול ₪99
};
```

### בדיקה מהירה בלי לפרוס קוד

פתח בדפדפן (אחרי התחברות בדף התשלום):

```
https://eladperlson.github.io/wa-lead-helper/pricing.html?pro_plan=P-XXX&unlimited_plan=P-YYY
```

## 3. אם הכפתור עדיין נכשל

## 3. פתרון נוסף

1. פתח את דף התשלום
2. לחץ F12 → **Console**
3. לחץ על כפתור PayPal
4. אם מופיעה שגיאה (למשל `VALIDATION_ERROR` או `plan_id`), העתק אותה

## מזהים נוכחיים בקוד

| מסלול | Plan ID |
|--------|---------|
| BASIC ₪29 | `P-5S302684SK139443NNJH645I` |
| UNLIMITED ₪99 | `P-5NP7360783546560KNJH65MA` |

**Client ID** (Live): `AbnyYBk1O8qV-D0P2yYu9_LQDh5QopccdOvIYoBv1SPIZWNgbLHXG55pEQosOJzXLlbCUJ5VCMAscYN3`

חשוב: ה-Client ID חייב להיות מאותה אפליקציה ב-PayPal שממנה הועתקו כפתורי המנוי.
