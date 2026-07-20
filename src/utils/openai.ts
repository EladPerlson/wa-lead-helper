import type { ChatMessage } from '@/utils/waDom';
import { OPENAI_API_KEY } from '@/supabase/config';
import { supabase } from '@/supabase/client';

export interface SuggestReplyContext {
  /** WhatsApp contact / chat partner (הלקוח) */
  customerName?: string;
  /** Extension user — business owner / WA account holder (משתמש באפליקציה) */
  appUserLabel?: string;
  notes?: string;
  tags?: string[];
  messages: ChatMessage[];
}

export interface AskChatContext extends SuggestReplyContext {
  question: string;
}

export interface AiUsageInfo {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  plan?: string;
  reason?: string;
}

export type AiResult = { text: string; error?: string; usage?: AiUsageInfo };

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export async function getAiUsage(): Promise<AiUsageInfo | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_ai_usage');
  if (error || !data) return null;
  return data as AiUsageInfo;
}

async function consumeAiCredit(): Promise<AiUsageInfo> {
  if (!supabase) {
    return { allowed: false, used: 0, limit: 0, remaining: 0, reason: 'not_configured' };
  }
  const { data, error } = await supabase.rpc('consume_ai_credit');
  if (error || !data) {
    return { allowed: false, used: 0, limit: 0, remaining: 0, reason: 'api_error' };
  }
  return data as AiUsageInfo;
}

async function refundAiCredit(): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('refund_ai_credit');
}

async function resolveAppUserLabel(explicit?: string): Promise<string | undefined> {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  if (!supabase) return undefined;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.email ?? undefined;
  } catch {
    return undefined;
  }
}

/** Clear speaker labels so the model never confuses customer vs app user. */
function speakerLabel(role: ChatMessage['role'], customerName?: string, appUserLabel?: string): string {
  if (role === 'them') {
    const name = customerName?.trim();
    return name
      ? `CUSTOMER/לקוח (${name})`
      : 'CUSTOMER/לקוח (איש הקשר ב-WhatsApp)';
  }
  const user = appUserLabel?.trim();
  return user
    ? `BUSINESS_OWNER/בעל_העסק (${user})`
    : 'BUSINESS_OWNER/בעל_העסק (משתמש האפליקציה)';
}

function formatTranscript(
  messages: ChatMessage[],
  customerName?: string,
  appUserLabel?: string,
): string {
  const fromCustomer = messages.filter((m) => m.role === 'them').length;
  const fromOwner = messages.filter((m) => m.role === 'me').length;
  const header = `מפתח תמליל: CUSTOMER/לקוח = הודעות נכנסות מהלקוח | BUSINESS_OWNER/בעל_העסק = הודעות יוצאות מבעל העסק (משתמש האפליקציה). ספירה: ${fromCustomer} מלקוח, ${fromOwner} מבעל העסק.`;

  const lines = messages.map((m, i) => {
    const n = String(i + 1).padStart(2, '0');
    const who = speakerLabel(m.role, customerName, appUserLabel);
    return `#${n} | ${who} | ${m.text}`;
  });

  return `${header}\n${lines.join('\n')}`;
}

/** Shared role legend prepended to every AI user prompt. */
function roleLegend(customerName?: string, appUserLabel?: string): string {
  const customer = customerName?.trim() || 'איש הקשר הפתוח בצ׳אט (הצד השני)';
  const appUser = appUserLabel?.trim() || 'בעל חשבון ה-WhatsApp / בעל העסק שמשתמש ב-WA Lead Helper';
  return `=== מיפוי תפקידים (חובה מוחלטת — אל תתבלבל) ===
1) CUSTOMER / לקוח = איש הקשר ב-WhatsApp. זה הצד השני בשיחה. שם: ${customer}
2) BUSINESS_OWNER / בעל העסק = משתמש האפליקציה WA Lead Helper. זה מי שמדבר אל הלקוח. מזהה: ${appUser}
3) בתמליל: שורות עם CUSTOMER/לקוח = מה שהלקוח שלח; שורות עם BUSINESS_OWNER/בעל_העסק = מה שבעל העסק שלח.
4) המילה "אני"/"שלי" בתוך הודעת לקוח מתייחסת ללקוח בלבד. בתוך הודעת בעל העסק — לבעל העסק בלבד.
5) בניתוח/סיכום/תשובה: תמיד ציין במפורש לקוח מול בעל העסק. לעולם אל תחליף ביניהם.
6) אתה עוזר את בעל העסק — לא את הלקוח.`;
}

async function callOpenAI(
  system: string,
  user: string,
  maxTokens: number,
  temperature = 0.4,
): Promise<{ text: string; error?: string }> {
  const key = OPENAI_API_KEY.trim();
  if (!key) return { text: '', error: 'missing_key' };

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 401) return { text: '', error: 'invalid_key' };
      if (res.status === 429) return { text: '', error: 'rate_limit' };
      return { text: '', error: 'api_error' };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) return { text: '', error: 'empty' };
    return { text: text.replace(/^["«]|["»]$/g, '').trim() };
  } catch {
    return { text: '', error: 'network' };
  }
}

async function withAiCredit(
  run: () => Promise<{ text: string; error?: string }>,
): Promise<AiResult> {
  const credit = await consumeAiCredit();
  if (!credit.allowed) {
    return {
      text: '',
      error: credit.reason === 'limit_reached' ? 'limit_reached' : 'api_error',
      usage: credit,
    };
  }

  const result = await run();
  if (result.error) {
    await refundAiCredit();
    return { text: '', error: result.error, usage: credit };
  }
  return { text: result.text, usage: credit };
}

export async function suggestReplyWithOpenAI(ctx: SuggestReplyContext): Promise<AiResult> {
  if (ctx.messages.length === 0) {
    return { text: '', error: 'no_messages' };
  }

  const appUserLabel = await resolveAppUserLabel(ctx.appUserLabel);
  const customerName = ctx.customerName?.trim() || undefined;
  const tagsLine = ctx.tags && ctx.tags.length > 0 ? ctx.tags.join(', ') : 'אין';
  const notesLine = ctx.notes?.trim() || 'אין';
  const transcript = formatTranscript(ctx.messages, customerName, appUserLabel);

  const system = `אתה עוזר מכירות ישראלי ל-WhatsApp Business, בתוך התוסף WA Lead Helper.
הלקוח שלך הוא BUSINESS_OWNER (בעל העסק / משתמש האפליקציה). אתה כותב הודעה שהוא ישלח ל-CUSTOMER (הלקוח).

כללי זהות:
- CUSTOMER/לקוח = איש הקשר ב-WhatsApp
- BUSINESS_OWNER/בעל_העסק = משתמש האפליקציה
- התשובה = גוף ראשון של בעל העסק אל הלקוח בלבד
- לעולם אל תכתוב כאילו הלקוח שולח את ההודעה

סגנון:
- עברית טבעית ודוגרית, עד 3 משפטים
- בלי מרכאות / הקדמות / הסברים — רק נוסח לשליחה
- אל תמציא עובדות שלא הופיעו בצ'אט או בהערות`;

  const user = `${roleLegend(customerName, appUserLabel)}

שם הלקוח (CUSTOMER): ${customerName || 'לא ידוע'}
תגיות על הלקוח: ${tagsLine}
הערות על הלקוח: ${notesLine}

תמליל השיחה (מהישן לחדש):
${transcript}

כתוב עכשיו הודעה אחת שבעל העסק (BUSINESS_OWNER) ישלח ללקוח (CUSTOMER):`;

  const result = await withAiCredit(() => callOpenAI(system, user, 300, 0.35));
  return result.error ? result : { text: result.text, usage: result.usage };
}

/** Ask a free-form question about the open chat (find details, recall info). */
export async function askChatQuestionWithOpenAI(ctx: AskChatContext): Promise<AiResult> {
  const question = ctx.question.trim();
  if (!question) return { text: '', error: 'empty_question' };
  if (ctx.messages.length === 0) return { text: '', error: 'no_messages' };

  const appUserLabel = await resolveAppUserLabel(ctx.appUserLabel);
  const customerName = ctx.customerName?.trim() || undefined;
  const tagsLine = ctx.tags && ctx.tags.length > 0 ? ctx.tags.join(', ') : 'אין';
  const notesLine = ctx.notes?.trim() || 'אין';
  const transcript = formatTranscript(ctx.messages, customerName, appUserLabel);

  const system = `אתה עוזר אישי ל-BUSINESS_OWNER (בעל העסק / משתמש WA Lead Helper).
קיבלת תמליל בין BUSINESS_OWNER לבין CUSTOMER (לקוח). בעל העסק שואל אותך על השיחה.

כללי זהות:
- CUSTOMER/לקוח ≠ BUSINESS_OWNER/בעל_העסק — לעולם אל תחליף
- כשמצטטים מידע: ציין במפורש אם זה מהלקוח או מבעל העסק
- אם השאלה על "מה הוא אמר" — "הוא" = הלקוח, אלא אם צוין אחרת

כללים:
- עברית ברורה וקצרה
- רק לפי הצ'אט וההערות — אל תמציא
- אם לא נמצא — כתוב במפורש שלא נמצא`;

  const user = `${roleLegend(customerName, appUserLabel)}

שם הלקוח (CUSTOMER): ${customerName || 'לא ידוע'}
תגיות על הלקוח: ${tagsLine}
הערות על הלקוח: ${notesLine}

תמליל השיחה (מהישן לחדש):
${transcript}

שאלת בעל העסק (BUSINESS_OWNER):
${question}

ענה לבעל העסק (הבחן תמיד בין לקוח לבעל העסק):`;

  return withAiCredit(() => callOpenAI(system, user, 500, 0.2));
}

/** Short Hebrew summary of the open chat. */
export async function summarizeChatWithOpenAI(ctx: SuggestReplyContext): Promise<AiResult> {
  if (ctx.messages.length === 0) return { text: '', error: 'no_messages' };

  const appUserLabel = await resolveAppUserLabel(ctx.appUserLabel);
  const customerName = ctx.customerName?.trim() || undefined;
  const transcript = formatTranscript(ctx.messages, customerName, appUserLabel);

  const system = `אתה מסכם שיחות WhatsApp עבור BUSINESS_OWNER (בעל העסק).
CUSTOMER = הלקוח; BUSINESS_OWNER = בעל העסק.
כללים:
- עד 4 משפטים בעברית
- בכל אזכור של מי אמר מה — כתוב במפורש "הלקוח" או "בעל העסק"
- אל תחליף בין הצדדים
- אל תמציא; בלי הקדמות/מרכאות — רק הסיכום`;

  const user = `${roleLegend(customerName, appUserLabel)}

שם הלקוח (CUSTOMER): ${customerName || 'לא ידוע'}
הערות על הלקוח: ${ctx.notes?.trim() || 'אין'}

תמליל:
${transcript}

כתוב סיכום קצר לבעל העסק (הבחן לקוח מול בעל עסק):`;

  return withAiCredit(() => callOpenAI(system, user, 350, 0.2));
}

export type ChatIntent = 'price' | 'appointment' | 'not_interested' | 'other';

export interface ChatInsights {
  intent: ChatIntent;
  suggestedTagIds: string[];
  facts: string[];
  summary?: string;
}

export type InsightsResult = { insights: ChatInsights | null; error?: string; usage?: AiUsageInfo };

const KNOWN_TAG_HINTS: Record<string, string[]> = {
  'hot-lead': ['ליד חם', 'חם', 'hot'],
  'follow-up': ['מעקב', 'לעקוב', 'follow'],
  'active-client': ['לקוח פעיל', 'פעיל'],
  'deal-closed': ['נסגר', 'עסקה', 'closed'],
  'not-relevant': ['לא רלוונטי', 'לא מעוניין', 'not interested'],
};

function parseInsightsJson(raw: string): ChatInsights | null {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as {
      intent?: string;
      suggestedTagIds?: string[];
      suggestedTags?: string[];
      facts?: string[];
    };

    const intentRaw = (parsed.intent ?? 'other').toLowerCase();
    const intent: ChatIntent =
      intentRaw === 'price' || intentRaw.includes('מחיר')
        ? 'price'
        : intentRaw === 'appointment' || intentRaw.includes('פגיש') || intentRaw.includes('תואם')
          ? 'appointment'
          : intentRaw === 'not_interested' || intentRaw.includes('לא מעוניין')
            ? 'not_interested'
            : 'other';

    let suggestedTagIds = Array.isArray(parsed.suggestedTagIds)
      ? parsed.suggestedTagIds.filter((x) => typeof x === 'string')
      : [];

    if (suggestedTagIds.length === 0 && Array.isArray(parsed.suggestedTags)) {
      for (const label of parsed.suggestedTags) {
        const lower = String(label).toLowerCase();
        for (const [id, hints] of Object.entries(KNOWN_TAG_HINTS)) {
          if (hints.some((h) => lower.includes(h.toLowerCase()))) {
            suggestedTagIds.push(id);
          }
        }
      }
    }

    if (intent === 'not_interested' && !suggestedTagIds.includes('not-relevant')) {
      suggestedTagIds.push('not-relevant');
    }
    if (intent === 'price' && !suggestedTagIds.includes('hot-lead')) {
      suggestedTagIds.push('follow-up');
    }
    if (intent === 'appointment' && !suggestedTagIds.includes('follow-up')) {
      suggestedTagIds.push('follow-up');
    }

    suggestedTagIds = Array.from(new Set(suggestedTagIds));

    const facts = Array.isArray(parsed.facts)
      ? parsed.facts.filter((f) => typeof f === 'string' && f.trim()).map((f) => f.trim())
      : [];

    return { intent, suggestedTagIds, facts };
  } catch {
    return null;
  }
}

/** Detect intent, suggest tags, extract facts from chat (one AI credit). */
export async function analyzeChatInsightsWithOpenAI(
  ctx: SuggestReplyContext,
): Promise<InsightsResult> {
  if (ctx.messages.length === 0) {
    return { insights: null, error: 'no_messages' };
  }

  const appUserLabel = await resolveAppUserLabel(ctx.appUserLabel);
  const customerName = ctx.customerName?.trim() || undefined;
  const transcript = formatTranscript(ctx.messages, customerName, appUserLabel);

  const system = `אתה מנתח שיחות מכירה ב-WhatsApp בעברית עבור BUSINESS_OWNER (בעל העסק).
CUSTOMER/לקוח = איש הקשר; BUSINESS_OWNER/בעל_העסק = משתמש האפליקציה.
intent מתייחס לכוונת הלקוח (CUSTOMER), לא לבעל העסק.
החזר JSON בלבד (בלי markdown):
{"intent":"price|appointment|not_interested|other","suggestedTagIds":["hot-lead"|"follow-up"|"active-client"|"deal-closed"|"not-relevant"],"facts":["לקוח: ...","בעל העסק: ..."]}
כללים:
- intent: לפי מה שהלקוח רוצה/מביע (מחיר / פגישה / לא מעוניין / אחר)
- suggestedTagIds: רק מהרשימה, עד 2
- facts: עד 4 עובדות קצרות; כל עובדה חייבת להתחיל ב"לקוח:" או "בעל העסק:" לפי מי אמר/ממנו נלקח המידע
- אל תמציא; אל תייחס הודעות של לקוח לבעל העסק ולהפך`;

  const user = `${roleLegend(customerName, appUserLabel)}

שם הלקוח (CUSTOMER): ${customerName || 'לא ידוע'}
הערות קיימות על הלקוח: ${ctx.notes?.trim() || 'אין'}
תגיות נוכחיות על הלקוח: ${(ctx.tags ?? []).join(', ') || 'אין'}

תמליל:
${transcript}

החזר JSON בלבד. בכל fact ציין לקוח: או בעל העסק:`;

  const credit = await consumeAiCredit();
  if (!credit.allowed) {
    return {
      insights: null,
      error: credit.reason === 'limit_reached' ? 'limit_reached' : 'api_error',
      usage: credit,
    };
  }

  const result = await callOpenAI(system, user, 400, 0.1);
  if (result.error) {
    await refundAiCredit();
    return { insights: null, error: result.error, usage: credit };
  }

  const insights = parseInsightsJson(result.text);
  if (!insights) {
    await refundAiCredit();
    return { insights: null, error: 'empty', usage: credit };
  }

  return { insights, usage: credit };
}

