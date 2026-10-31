import React, { useState } from 'react';
import { Lock, Loader2, Mic } from 'lucide-react';
import { TranslationSchema, AppLanguage } from '../utils/i18n';
import { setStoredPassword, verifyPassword } from '../utils/api';

interface LoginScreenProps {
  isChecking: boolean;
  onSuccess: () => void;
  t: TranslationSchema;
  language: AppLanguage;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ isChecking, onSuccess, t, language }) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArabicUI = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const ok = await verifyPassword(password);
      if (ok) {
        setStoredPassword(password.trim());
        onSuccess();
      } else {
        setError(t.loginErrorWrong);
      }
    } catch {
      setError(t.loginErrorWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={isArabicUI ? 'rtl' : 'ltr'}
      className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 font-cairo"
    >
      <div className="w-full max-w-sm bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{t.appTitle}</h1>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{t.loginSubtitle}</p>
          </div>
        </div>

        {isChecking ? (
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t.loginChecking}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              {t.loginTitle}
            </label>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.loginPlaceholder}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.loginChecking}
                </>
              ) : (
                t.loginButton
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
