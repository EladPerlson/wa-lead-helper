import { useState } from 'react';
import { Button } from '@/components/Button';
import { he } from '@/i18n/he';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  { title: he.onboarding.step1Title, body: he.onboarding.step1Body, icon: '👋' },
  { title: he.onboarding.step2Title, body: he.onboarding.step2Body, icon: '🏷️' },
  { title: he.onboarding.step3Title, body: he.onboarding.step3Body, icon: '✨' },
] as const;

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  if (!open) return null;

  const isLast = step >= STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-brand-ink/60 backdrop-blur-md" />
      <div className="relative wa-lh-glass wa-lh-glow-ring rounded-4xl p-5 shadow-notion-lg max-w-sm w-full animate-rise space-y-4">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onComplete}
            className="text-xs text-notion-muted hover:text-notion-text"
          >
            {he.onboarding.skip}
          </button>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${i === step ? 'bg-notion-accent' : 'bg-notion-border'}`}
              />
            ))}
          </div>
        </div>

        <div className="text-center space-y-3 py-2">
          <div className="text-4xl">{current.icon}</div>
          <h3 className="text-lg font-bold text-notion-text">{current.title}</h3>
          <p className="text-sm text-notion-muted leading-relaxed">{current.body}</p>
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="ghost" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              חזרה
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => {
              if (isLast) onComplete();
              else setStep((s) => s + 1);
            }}
          >
            {isLast ? he.onboarding.finish : he.onboarding.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
