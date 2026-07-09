import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PLANS, formatLimit } from '@/plans';
import type { PlanId } from '@/plans';
import { PRICING_URL } from '@/constants/urls';
import { he } from '@/i18n/he';
import type { SubscriptionState } from '@/hooks/useSubscription';
import { countTaggedCustomers, getReminderNotificationsToday } from '@/utils/limits';
import { useTemplates } from '@/hooks/useStorageLists';

interface PricingPanelProps {
  subscription: SubscriptionState;
  userEmail?: string;
}

export function PricingPanel({ subscription, userEmail }: PricingPanelProps) {
  const { plan, limits } = subscription;
  const { templates } = useTemplates();
  const [taggedCount, setTaggedCount] = useState(0);
  const [remindersToday, setRemindersToday] = useState(0);

  useEffect(() => {
    void countTaggedCustomers().then(setTaggedCount);
    void getReminderNotificationsToday().then(setRemindersToday);
  }, [plan, templates.length]);

  const openPricing = (targetPlan?: PlanId) => {
    const url = new URL(PRICING_URL);
    if (userEmail) url.searchParams.set('email', userEmail);
    if (targetPlan && targetPlan !== 'free') url.searchParams.set('plan', targetPlan);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <Card title={he.pricing.currentPlan}>
        <div className="space-y-2 text-sm text-right">
          <p className="font-semibold text-notion-text">
            {PLANS[plan].name}
            {PLANS[plan].priceUsd > 0 && (
              <span className="text-notion-muted font-normal mr-1">
                (${PLANS[plan].priceUsd}/חודש)
              </span>
            )}
          </p>
          <p className="text-xs text-notion-muted">
            {he.pricing.usageTagged}: {taggedCount}/{formatLimit(limits.taggedCustomers)}
          </p>
          <p className="text-xs text-notion-muted">
            {he.pricing.usageReminders}: {remindersToday}/{formatLimit(limits.remindersPerDay)}
          </p>
          <p className="text-xs text-notion-muted">
            {he.pricing.usageReplies}: {templates.length}/{formatLimit(limits.templates)}
          </p>
        </div>
      </Card>

      {plan !== 'unlimited' && (
        <Card title={he.pricing.upgradeTitle}>
          <div className="space-y-2">
            {(['pro', 'unlimited'] as const)
              .filter((id) => id !== plan)
              .map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl border border-notion-border"
                >
                  <Button size="sm" onClick={() => openPricing(id)}>
                    {he.pricing.upgrade}
                  </Button>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-sm font-medium text-notion-text">{PLANS[id].name}</p>
                    <p className="text-xs text-notion-muted">
                      ${PLANS[id].priceUsd}/{he.pricing.perMonth} ·{' '}
                      {formatLimit(PLANS[id].limits.taggedCustomers)} {he.pricing.tagsLabel} ·{' '}
                      {formatLimit(PLANS[id].limits.remindersPerDay)} {he.pricing.remindersLabel} ·{' '}
                      {formatLimit(PLANS[id].limits.templates)} {he.pricing.repliesLabel}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Button variant="secondary" size="sm" className="w-full" onClick={() => openPricing()}>
        {he.pricing.viewPlans}
      </Button>
    </div>
  );
}
