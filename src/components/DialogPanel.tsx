import React, { useState } from 'react';
import { MessagesSquare, Wand2, Sparkles, Loader2, Check, X, AlertTriangle, Users } from 'lucide-react';
import { AVAILABLE_VOICES } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage, fill } from '../utils/i18n';
import { apiPost } from '../utils/api';
import { DIALOG_SAMPLES, DialogError, ParsedDialog, MAX_DIALOG_CHARS } from '../utils/dialog';

interface DialogPanelProps {
  script: string;
  onChangeScript: (script: string) => void;
  parsed: ParsedDialog;
  voices: [string, string];
  onChangeVoices: (voices: [string, string]) => void;
  onOpenAiAssistant: () => void;
  t: TranslationSchema;
  language: AppLanguage;
}

/** Ubah kode kesalahan naskah menjadi kalimat yang mudah dipahami. */
export function dialogErrorMessage(err: DialogError, t: TranslationSchema): string {
  const vars = { line: err.line ?? '', name: err.detail ?? '', detail: err.detail ?? '' };
  switch (err.code) {
    case 'EMPTY':
      return t.dialogErrEmpty;
    case 'NO_NAME_FIRST_LINE':
      return fill(t.dialogErrNoNameFirst, vars);
    case 'TOO_MANY_SPEAKERS':
      return fill(t.dialogErrTooMany, vars);
    case 'ONE_SPEAKER':
      return t.dialogErrOneSpeaker;
    case 'TOO_MANY_LINES':
      return fill(t.dialogErrTooManyLines, vars);
    case 'TOO_LONG':
      return fill(t.dialogErrTooLong, vars);
    case 'NAME_TOO_LONG':
      return fill(t.dialogErrNameTooLong, vars);
    default:
      return t.dialogErrEmpty;
  }
}

const SPEAKER_COLORS = [
  { chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30', bubble: 'border-sky-500/20 bg-sky-950/20' },
  { chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30', bubble: 'border-rose-500/20 bg-rose-950/20' },
];

export const DialogPanel: React.FC<DialogPanelProps> = ({
  script,
  onChangeScript,
  parsed,
  voices,
  onChangeVoices,
  onOpenAiAssistant,
  t,
  language,
}) => {
  const [isTashkeeling, setIsTashkeeling] = useState(false);
  const [tashkeelSuccess, setTashkeelSuccess] = useState(false);
  const isArabicUI = language === 'ar';

  const handleAutoTashkeel = async () => {
    if (!script.trim()) return;
    setIsTashkeeling(true);
    setTashkeelSuccess(false);
    try {
      const { res, data } = await apiPost('/api/ai/tashkeel', { text: script.trim(), format: 'dialog' });
      if (res.ok && data.success && data.textWithTashkeel) {
        onChangeScript(data.textWithTashkeel);
        setTashkeelSuccess(true);
        setTimeout(() => setTashkeelSuccess(false), 2500);
      } else {
        window.alert(data.error || 'Gagal memberi harakat otomatis.');
      }
    } catch {
      window.alert('Gagal menghubungi server untuk memberi harakat.');
    } finally {
      setIsTashkeeling(false);
    }
  };

  const setVoice = (index: number, voiceName: string) => {
    const next: [string, string] = [voices[0], voices[1]];
    next[index] = voiceName;
    onChangeVoices(next);
  };

  const sampleLabel = (s: (typeof DIALOG_SAMPLES)[number]) =>
    language === 'ar' ? s.labelAr : language === 'en' ? s.labelEn : s.labelId;

  const voiceOptionLabel = (id: string) => {
    const v = AVAILABLE_VOICES.find((x) => x.id === id);
    if (!v) return id;
    const gender = v.gender.includes('أنثى') ? t.voiceFemale : t.voiceMale;
    return `${v.name} — ${gender}`;
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
      {/* Judul + tombol */}
      <div className={`flex flex-wrap items-center justify-between gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-cairo">
          <MessagesSquare className="w-3.5 h-3.5 text-indigo-400" />
          {t.dialogTitle}
        </label>

        <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="text-xs px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Wand2 className="w-3 h-3 text-amber-300" />
            <span>{t.writeWithAiBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleAutoTashkeel}
            disabled={isTashkeeling || !script.trim()}
            className="text-xs px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTashkeeling ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                <span>{t.tashkeelingBtn}</span>
              </>
            ) : tashkeelSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{t.tashkeelDoneBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{t.tashkeelBtn}</span>
              </>
            )}
          </button>

          {script.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeScript('')}
              className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              {t.clearBtn}
            </button>
          )}
        </div>
      </div>

      {/* Contoh dialog */}
      <div className={`flex flex-wrap items-center gap-2 text-xs ${isArabicUI ? 'flex-row-reverse' : ''}`}>
        <span className="text-zinc-500 font-cairo">{t.dialogSamplesLabel}</span>
        {DIALOG_SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              onChangeScript(s.script);
              onChangeVoices(s.voices);
            }}
            className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer font-cairo"
          >
            {sampleLabel(s)}
          </button>
        ))}
      </div>

      {/* Petunjuk format */}
      <p className="text-[11px] text-zinc-500 leading-relaxed font-cairo">{t.dialogFormatHint}</p>

      {/* Naskah */}
      <textarea
        dir="rtl"
        value={script}
        onChange={(e) => onChangeScript(e.target.value)}
        rows={8}
        placeholder={'أحمد: السَّلَامُ عَلَيْكُمْ\nفاطمة (بفرح): وَعَلَيْكُمُ السَّلَامُ'}
        className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 font-arabic text-lg leading-loose text-right resize-y"
      />
      <div className="text-[11px] text-zinc-500 font-mono">
        {fill(t.dialogLinesInfo, { lines: parsed.lines.length, chars: parsed.totalChars })}
        {parsed.totalChars > MAX_DIALOG_CHARS && <span className="text-rose-400"> ⚠</span>}
      </div>

      {/* Tokoh & suara */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-cairo">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          {t.dialogCharactersTitle}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${SPEAKER_COLORS[i].bubble}`}
            >
              <span className={`text-sm px-2 py-0.5 rounded border font-arabic ${SPEAKER_COLORS[i].chip}`} dir="auto">
                {parsed.names[i] || fill(t.dialogCharacterPlaceholder, { n: i + 1 })}
              </span>
              <select
                value={voices[i]}
                onChange={(e) => setVoice(i, e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {voiceOptionLabel(v.id)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {voices[0] === voices[1] && (
          <p className="text-[11px] text-amber-300 flex items-center gap-1 font-cairo">
            <AlertTriangle className="w-3 h-3" />
            {t.dialogSameVoiceWarn}
          </p>
        )}
      </div>

      {/* Kesalahan naskah */}
      {parsed.errors.length > 0 && script.trim() && (
        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-[11px] text-rose-300 space-y-1 font-cairo">
          {parsed.errors.map((err, i) => (
            <p key={i}>• {dialogErrorMessage(err, t)}</p>
          ))}
        </div>
      )}

      {/* Pratinjau */}
      {parsed.lines.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-zinc-500 font-cairo">{t.dialogPreviewTitle}</div>
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {parsed.lines.map((line, i) => (
              <div key={i} dir="rtl" className={`p-2 rounded-lg border text-right ${SPEAKER_COLORS[line.speaker].bubble}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[11px] px-1.5 rounded border font-arabic ${SPEAKER_COLORS[line.speaker].chip}`}>
                    {parsed.names[line.speaker]}
                  </span>
                  {line.expression && (
                    <span className="text-[11px] text-amber-300/90 font-arabic">({line.expression})</span>
                  )}
                </div>
                <p className="text-zinc-200 font-arabic text-base leading-relaxed">{line.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
