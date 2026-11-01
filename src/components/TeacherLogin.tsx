import React, { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { TranslationSchema } from '../utils/i18n';
import { apiPost, setTeacherPassword } from '../utils/api';

interface TeacherLoginProps {
  t: TranslationSchema;
  onLoggedIn?: () => void;
}

/** Kotak kecil "Masuk sebagai guru" (sandi guru disimpan di perangkat ini). */
export const TeacherLogin: React.FC<TeacherLoginProps> = ({ t, onLoggedIn }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pw = password.trim();
    if (!pw || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { res, data } = await apiPost('/api/koleksi/guru', {}, { teacherPassword: pw });
      if (res.ok && data.success) {
        setTeacherPassword(pw);
        setPassword('');
        onLoggedIn?.();
      } else {
        setError(data.code === 'TEACHER_NOT_SET' ? t.teacherNotSet : data.code === 'TEACHER_REQUIRED' ? t.teacherWrong : data.error || t.teacherWrong);
      }
    } catch {
      setError(t.teacherWrong);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
        <input
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.teacherPasswordPlaceholder}
          className="flex-1 min-w-0 bg-zinc-950 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!password.trim() || busy}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-600/80 hover:bg-amber-500 text-white disabled:opacity-50 cursor-pointer flex items-center gap-1 font-cairo"
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}
          {t.teacherLoginBtn}
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-400 font-cairo">{error}</p>}
    </form>
  );
};
