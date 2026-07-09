import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { he } from '@/i18n/he';
import type { AuthState } from '@/hooks/useAuth';

interface AuthScreenProps {
  auth: AuthState;
}

type AuthMode = 'login' | 'register' | 'forgot';

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return he.auth.invalidCredentials;
  if (lower.includes('email not confirmed')) return he.auth.emailNotConfirmed;
  if (lower.includes('already registered')) return he.auth.userExists;
  if (lower.includes('password should be at least')) return he.auth.weakPassword;
  if (lower.includes('invalid email') || lower.includes('validate email')) return he.auth.invalidEmail;
  return he.auth.genericError;
}

function getTitle(mode: AuthMode): string {
  if (mode === 'login') return he.auth.loginTitle;
  if (mode === 'register') return he.auth.registerTitle;
  return he.auth.forgotPasswordTitle;
}

export function AuthScreen({ auth }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!auth.configured) {
    return (
      <div className="p-4" dir="rtl">
        <Card>
          <p className="text-sm text-notion-text text-right leading-relaxed">{he.auth.notConfigured}</p>
        </Card>
      </div>
    );
  }

  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    clearMessages();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    clearMessages();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: err } = await auth.signIn(email.trim(), password);
        if (err) setError(translateAuthError(err));
      } else if (mode === 'register') {
        const { error: err, needsEmailConfirm } = await auth.signUp(email.trim(), password);
        if (err) {
          setError(translateAuthError(err));
        } else if (needsEmailConfirm) {
          setInfo(he.auth.confirmEmailSent);
          switchMode('login');
        }
      } else {
        const trimmed = email.trim();
        if (!trimmed) {
          setError(he.auth.enterEmailForReset);
          return;
        }
        const { error: err } = await auth.resetPassword(trimmed);
        if (err) setError(translateAuthError(err));
        else setInfo(he.auth.resetEmailSent);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel =
    mode === 'login'
      ? submitting
        ? he.auth.loggingIn
        : he.auth.loginButton
      : mode === 'register'
        ? submitting
          ? he.auth.registering
          : he.auth.registerButton
        : submitting
          ? he.auth.sendingResetLink
          : he.auth.sendResetLink;

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <div className="text-center pt-6 pb-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-notion-accent text-white flex items-center justify-center font-bold text-lg mb-3">
          WA
        </div>
        <h2 className="text-lg font-bold text-notion-text">{getTitle(mode)}</h2>
        <p className="text-xs text-notion-muted mt-1">
          {mode === 'forgot' ? he.auth.forgotPasswordHint : he.auth.loginRequired}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label={he.auth.email}
            type="email"
            autoComplete="email"
            placeholder={he.auth.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
            className="text-left"
          />

          {mode !== 'forgot' && (
            <Input
              label={he.auth.password}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={he.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              dir="ltr"
              className="text-left"
            />
          )}

          {error && <p className="text-xs text-red-500 text-right">{error}</p>}
          {info && <p className="text-xs text-green-600 text-right">{info}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitLabel}
          </Button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              disabled={submitting}
              className="block w-full text-center text-xs text-notion-muted hover:text-notion-accent hover:underline disabled:opacity-50"
            >
              {he.auth.forgotPassword}
            </button>
          )}
        </form>
      </Card>

      {mode === 'forgot' ? (
        <button
          type="button"
          onClick={() => switchMode('login')}
          className="block w-full text-center text-xs text-notion-accent hover:underline"
        >
          {he.auth.backToLogin}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="block w-full text-center text-xs text-notion-accent hover:underline"
        >
          {mode === 'login' ? he.auth.switchToRegister : he.auth.switchToLogin}
        </button>
      )}
    </div>
  );
}
