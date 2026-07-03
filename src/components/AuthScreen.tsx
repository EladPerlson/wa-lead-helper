import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { he } from '@/i18n/he';
import type { AuthState } from '@/hooks/useAuth';

interface AuthScreenProps {
  auth: AuthState;
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return he.auth.invalidCredentials;
  if (lower.includes('email not confirmed')) return he.auth.emailNotConfirmed;
  if (lower.includes('already registered')) return he.auth.userExists;
  if (lower.includes('password should be at least')) return he.auth.weakPassword;
  if (lower.includes('invalid email') || lower.includes('validate email')) return he.auth.invalidEmail;
  return he.auth.genericError;
}

export function AuthScreen({ auth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: err } = await auth.signIn(email.trim(), password);
        if (err) setError(translateAuthError(err));
      } else {
        const { error: err, needsEmailConfirm } = await auth.signUp(email.trim(), password);
        if (err) {
          setError(translateAuthError(err));
        } else if (needsEmailConfirm) {
          setInfo(he.auth.confirmEmailSent);
          setMode('login');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError(null);
    setInfo(null);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <div className="text-center pt-6 pb-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-notion-accent text-white flex items-center justify-center font-bold text-lg mb-3">
          WA
        </div>
        <h2 className="text-lg font-bold text-notion-text">
          {mode === 'login' ? he.auth.loginTitle : he.auth.registerTitle}
        </h2>
        <p className="text-xs text-notion-muted mt-1">{he.auth.loginRequired}</p>
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

          {error && <p className="text-xs text-red-500 text-right">{error}</p>}
          {info && <p className="text-xs text-green-600 text-right">{info}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? mode === 'login'
                ? he.auth.loggingIn
                : he.auth.registering
              : mode === 'login'
                ? he.auth.loginButton
                : he.auth.registerButton}
          </Button>
        </form>
      </Card>

      <button
        type="button"
        onClick={switchMode}
        className="block w-full text-center text-xs text-notion-accent hover:underline"
      >
        {mode === 'login' ? he.auth.switchToRegister : he.auth.switchToLogin}
      </button>
    </div>
  );
}
