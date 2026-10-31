import React, { useState } from 'react';
import { User, Gauge, Sparkles } from 'lucide-react';
import { AVAILABLE_VOICES, VoiceOption, TTSStyleId, STYLE_CONFIGS, TempoId } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage } from '../utils/i18n';

interface VoiceAndSettingsProps {
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  tempo: TempoId;
  onChangeTempo: (tempo: TempoId) => void;
  customDirective: string;
  onChangeCustomDirective: (val: string) => void;
  activeStyle: TTSStyleId;
  t: TranslationSchema;
  language: AppLanguage;
}

export const VoiceAndSettings: React.FC<VoiceAndSettingsProps> = ({
  selectedVoice,
  onSelectVoice,
  tempo,
  onChangeTempo,
  customDirective,
  onChangeCustomDirective,
  activeStyle,
  t,
  language,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeStyleConfig = STYLE_CONFIGS[activeStyle];

  const tempoOptions: { id: TempoId; label: string; hint: string }[] = [
    { id: 'normal', label: t.tempoNormal, hint: t.tempoHintNormal },
    { id: 'lambat', label: t.tempoSlow, hint: t.tempoHintSlow },
    { id: 'eja', label: t.tempoWordByWord, hint: t.tempoHintWord },
  ];
  const activeTempoHint = tempoOptions.find((o) => o.id === tempo)?.hint || '';
  const isArabicUI = language === 'ar';

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Voice selection */}
      <div>
        <div
          className={`flex items-center justify-between mb-2 ${
            isArabicUI ? 'flex-row-reverse' : ''
          }`}
        >
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-cairo">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            {t.voiceTitle}
          </label>
          <span className="text-[11px] text-zinc-500 font-mono">{t.voiceSubtitle}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {AVAILABLE_VOICES.map((voice: VoiceOption) => {
            const isSelected = selectedVoice === voice.id;
            const genderLabel = voice.gender.includes('أنثى') ? t.voiceFemale : t.voiceMale;
            const charDesc =
              language === 'ar'
                ? voice.characterArabic
                : language === 'en'
                ? voice.id === 'Kore'
                  ? 'Warm, articulate, and clear Arabic pronunciation'
                  : voice.id === 'Fenrir'
                  ? 'Deep, authoritative news anchor timbre'
                  : voice.id === 'Puck'
                  ? 'Youthful, energetic and lively tone'
                  : voice.id === 'Zephyr'
                  ? 'Bright, elegant and modern voice'
                  : 'Calm, reflective and contemplative'
                : voice.character;

            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => onSelectVoice(voice.id)}
                className={`p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                  isArabicUI ? 'text-right' : 'text-left'
                } ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50 text-white'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`flex items-center justify-between mb-1 ${
                    isArabicUI ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span className="font-semibold text-zinc-100">{voice.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded ${
                      voice.gender.includes('أنثى')
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {genderLabel}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight line-clamp-2 font-cairo">
                  {charDesc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed & Advanced Controls bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        {/* Tempo bicara (dibuat oleh Gemini) */}
        <div className={`flex flex-col gap-1 ${isArabicUI ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-zinc-400 flex items-center gap-1 font-cairo">
              <Gauge className="w-3.5 h-3.5 text-zinc-500" />
              {t.speedLabel}
            </span>
            <div className="inline-flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
              {tempoOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeTempo(opt.id)}
                  title={opt.hint}
                  className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer font-cairo ${
                    tempo === opt.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-cairo">{activeTempoHint}</span>
        </div>

        {/* Toggle custom nuance */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {showAdvanced ? t.customNuanceClose : t.customNuanceToggle}
        </button>
      </div>

      {/* Advanced Nuance Box */}
      {showAdvanced && (
        <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2 text-xs">
          <div
            className={`flex items-center justify-between ${
              isArabicUI ? 'flex-row-reverse' : ''
            }`}
          >
            <label className="text-zinc-300 font-medium font-cairo">
              {t.customNuanceLabel}
            </label>
            <span className="text-[10px] text-zinc-500">{t.customNuanceOptional}</span>
          </div>

          <div
            dir="rtl"
            className="text-[11px] text-zinc-400 p-2 rounded bg-zinc-900 border border-zinc-800 font-arabic text-right leading-relaxed"
          >
            <span className="text-zinc-500 not-italic">{t.baseDirectivePrefix} </span>
            <span className="text-zinc-300">{activeStyleConfig.directive}</span>
          </div>

          <input
            type="text"
            dir={isArabicUI ? 'rtl' : 'ltr'}
            value={customDirective}
            onChange={(e) => onChangeCustomDirective(e.target.value)}
            placeholder={t.customNuancePlaceholder}
            className={`w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs font-cairo ${
              isArabicUI ? 'text-right' : 'text-left'
            }`}
          />
        </div>
      )}
    </div>
  );
};
