export type PlanId = 'free' | 'pro' | 'unlimited';

export interface PlanLimits {
  taggedCustomers: number;
  remindersPerDay: number;
  templates: number;
  /** free = lifetime once; pro = per calendar month; unlimited = Infinity */
  aiSuggestions: number;
  aiPeriod: 'lifetime' | 'month' | 'none';
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  priceNis: number;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: 'free',
    name: 'חינמי',
    priceNis: 0,
    limits: {
      taggedCustomers: 3,
      remindersPerDay: 1,
      templates: 2,
      aiSuggestions: 1,
      aiPeriod: 'lifetime',
    },
  },
  pro: {
    id: 'pro',
    name: 'בסיסי',
    priceNis: 29,
    limits: {
      taggedCustomers: 12,
      remindersPerDay: 6,
      templates: 6,
      aiSuggestions: 30,
      aiPeriod: 'month',
    },
  },
  unlimited: {
    id: 'unlimited',
    name: 'ללא הגבלה',
    priceNis: 99,
    limits: {
      taggedCustomers: Infinity,
      remindersPerDay: Infinity,
      templates: Infinity,
      aiSuggestions: Infinity,
      aiPeriod: 'none',
    },
  },
};

export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLANS[plan].limits;
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value);
}

export function formatLimit(value: number): string {
  return isUnlimited(value) ? 'ללא הגבלה' : String(value);
}

export function formatPlanPrice(priceNis: number): string {
  return priceNis === 0 ? 'חינמי' : `₪${priceNis}`;
}

export function normalizePlanId(value: string | null | undefined): PlanId {
  if (value === 'pro' || value === 'unlimited') return value;
  return 'free';
}
