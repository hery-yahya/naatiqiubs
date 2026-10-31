import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Smile,
  Newspaper,
  Play,
  Pause,
  Download,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { TTSStyleId, STYLE_CONFIGS } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage } from '../utils/i18n';

export interface ComparisonResult {
  styleId: TTSStyleId;
  audioBase64: string | null;
  mimeType: string;
  directive: string;
  modelUsed?: string;
  success?: boolean;
  error?: string;
  isSimulated?: boolean;
  isQuotaExceeded?: boolean;
}

interface ComparisonMatrixProps {
  results: ComparisonResult[];
  text: string;
  voiceName: string;
  onClose: () => void;
  t: TranslationSchema;
  language: AppLanguage;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  results,
  text,
  voiceName,
  onClose,
  t,
  language,
}) => {
  const [playingStyle, setPlayingStyle] = useState<TTSStyleId | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const handleTogglePlay = (styleId: TTSStyleId) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== styleId && audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    const targetAudio = audioRefs.current[styleId];
    if (!targetAudio) return;

    if (playingStyle === styleId) {
      targetAudio.pause();
      setPlayingStyle(null);
    } else {
      targetAudio
        .play()
        .then(() => setPlayingStyle(styleId))
        .catch((err) => console.error('Play error:', err));
    }
  };

  const handleDownload = (styleId: TTSStyleId, base64: string) => {
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${base64}`;
    link.download = `gemini-arabic-${styleId}-${voiceName.toLowerCase()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isArabicUI = language === 'ar';

  return (
    <div className="bg-zinc-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse text-right' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-cairo">
              {t.compareModalTitle}
            </h3>
            <p className="text-xs text-zinc-400">
              {t.compareModalSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          {t.compareCloseBtn}
        </button>
      </div>

      {/* Script snippet in Arabic */}
      <div
        dir="rtl"
        className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-sm font-arabic text-zinc-200 leading-relaxed text-right"
      >
        <span className="text-zinc-500 font-sans text-xs ml-1 font-semibold">
          {t.comparedTextLabel}
        </span>{' '}
        &ldquo;{text}&rdquo;
      </div>

      {/* 3 Columns Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {results.map((res) => {
          const cfg = STYLE_CONFIGS[res.styleId] || STYLE_CONFIGS.netral;
          const isCurrentlyPlaying = playingStyle === res.styleId;
          const hasAudio = Boolean(res.audioBase64);

          const styleName =
            res.styleId === 'netral'
              ? t.styleNetralName
              : res.styleId === 'gembira'
              ? t.styleGembiraName
              : t.styleFormalName;

          const styleBadge =
            res.styleId === 'netral'
              ? t.styleNetralBadge
              : res.styleId === 'gembira'
              ? t.styleGembiraBadge
              : t.styleFormalBadge;

          const styleDesc =
            res.styleId === 'netral'
              ? t.styleNetralDesc
              : res.styleId === 'gembira'
              ? t.styleGembiraDesc
              : t.styleFormalDesc;

          return (
            <div
              key={res.styleId}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between overflow-hidden ${
                isArabicUI ? 'text-right' : 'text-left'
              } ${
                res.styleId === 'netral'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : res.styleId === 'gembira'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-indigo-950/20 border-indigo-500/40'
              }`}
            >
              {hasAudio && (
                <audio
                  ref={(el) => {
                    audioRefs.current[res.styleId] = el;
                  }}
                  src={`data:audio/wav;base64,${res.audioBase64}`}
                  onEnded={() => setPlayingStyle(null)}
                  onPause={() => {
                    if (playingStyle === res.styleId) setPlayingStyle(null);
                  }}
                />
              )}

              {/* Title & Icon */}
              <div>
                <div
                  className={`flex items-center justify-between mb-2 ${
                    isArabicUI ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      res.styleId === 'netral'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : res.styleId === 'gembira'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {res.styleId === 'netral' && <Sparkles className="w-3 h-3" />}
                    {res.styleId === 'gembira' && <Smile className="w-3 h-3" />}
                    {res.styleId === 'formal_berita' && <Newspaper className="w-3 h-3" />}
                    {styleName}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{styleBadge}</span>
                </div>

                <p
                  dir={isArabicUI ? 'rtl' : 'ltr'}
                  className="text-[11px] text-zinc-300 leading-snug mb-3 font-cairo"
                >
                  {styleDesc}
                </p>

                {res.isQuotaExceeded && (
                  <div className="mb-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1 font-cairo">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                    <span>{t.quotaExceededBadge}</span>
                  </div>
                )}
              </div>

              {/* Player control */}
              <div
                className={`pt-3 border-t border-zinc-800/80 flex items-center justify-between ${
                  isArabicUI ? 'flex-row-reverse' : ''
                }`}
              >
                {hasAudio ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(res.styleId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer ${
                        res.styleId === 'netral'
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : res.styleId === 'gembira'
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>{t.pauseBtn}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>{t.playBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(res.styleId, res.audioBase64!)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                      title={t.downloadWavBtn}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="max-w-full overflow-hidden text-[11px] text-rose-400 font-medium break-words leading-tight p-1 bg-rose-950/20 rounded border border-rose-900/30">
                    {res.error || t.failedAudio}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
