import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getPlanLimits, normalizePlanId, type PlanId } from '@/plans';
import { getStorageItem, setStorageItem } from '@/storage';
import { supabase } from '@/supabase/client';
import type { Settings } from '@/types';

export interface SubscriptionState {
  plan: PlanId;
  limits: ReturnType<typeof getPlanLimits>;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(session: Session | null): SubscriptionState {
  const [plan, setPlan] = useState<PlanId>('free');
  const [loading, setLoading] = useState(Boolean(session));

  const refresh = useCallback(async () => {
    if (!session?.user?.id || !supabase) {
      setPlan('free');
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!error && data?.plan) {
      const nextPlan = normalizePlanId(data.plan);
      setPlan(nextPlan);
      const settings: Settings = (await getStorageItem('settings')) ?? { darkMode: false };
      if (settings.cachedPlan !== nextPlan) {
        await setStorageItem('settings', { ...settings, cachedPlan: nextPlan });
      }
    } else {
      setPlan('free');
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return {
    plan,
    limits: getPlanLimits(plan),
    loading,
    refresh,
  };
}
