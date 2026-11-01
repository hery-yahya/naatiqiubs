import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Smile,
  Newspaper,
  Check,
  Share2,
} from 'lucide-react';
import { TTSStyleId, STYLE_CONFIGS, formatTime, TempoId } from '../utils/tts-helper';
import { DownloadButtons } from './DownloadButtons';
import { CloudUpload } from 'lucide-react';
import { TranslationSchema, AppLanguage } from '../utils/i18n';

interface AudioPlayerProps {
  audioBase64: string;
  styleId: TTSStyleId;
  voiceName: string;
  textSnippet: string;
  playbackSpeed: number;
  tempo?: TempoId;
  customDirective?: string;
  timestamp: number;
  /** Diisi untuk audio dialog */
  speakers?: { name: string; voiceName: string }[];
  /** Diisi kalau Koleksi Audio aktif: menampilkan tombol "Simpan ke Koleksi" */
  onSaveToKoleksi?: () => void;
  t: TranslationSchema;
  language: AppLanguage;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  styleId,
  voiceName,
  textSnippet,
  playbackSpeed,
  tempo,
  customDirective,
  timestamp,
  speakers,
  onSaveToKoleksi,
  t,
  language,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const styleConfig = STYLE_CONFIGS[styleId] || STYLE_CONFIGS.netral;
  const audioSrc = `data:audio/wav;base64,${audioBase64}`;

  const styleLocalizedName =
    styleId === 'netral'
      ? t.styleNetralName
      : styleId === 'gembira'
      ? t.styleGembiraName
      : t.styleFormalName;

  const styleLocalizedBadge =
    styleId === 'netral'
      ? t.styleNetralBadge
      : styleId === 'gembira'
      ? t.styleGembiraBadge
      : t.styleFormalBadge;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [audioBase64]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMuted = !isMuted;
      audioRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const downloadMeta = { text: textSnippet, styleId, voiceName, tempo, customDirective, timestamp, speakers };

  const tempoName = tempo === 'lambat' ? t.tempoSlow : tempo === 'eja' ? t.tempoWordByWord : t.tempoNormal;

  const handleCopyText = () => {
    navigator.clipboard.writeText(textSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isArabicUI = language === 'ar';

  // 28 animated waveform bars
  const visualizerBars = Array.from({ length: 28 }, (_, i) => {
    const heightPercent = isPlaying
      ? Math.min(100, Math.max(15, Math.floor(Math.sin((i + currentTime * 8) * 0.7) * 45 + 55)))
      : 20;
    return heightPercent;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Decorative gradient background based on style */}
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
          styleId === 'netral'
            ? 'bg-emerald-500'
            : styleId === 'gembira'
            ? 'bg-amber-500'
            : 'bg-indigo-500'
        }`}
      />

      {/* Header Info */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 mb-4 relative z-10 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        <div className={`flex flex-wrap items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              styleId === 'netral'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : styleId === 'gembira'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
            }`}
          >
            {styleId === 'netral' && <Sparkles className="w-3.5 h-3.5" />}
            {styleId === 'gembira' && <Smile className="w-3.5 h-3.5" />}
            {styleId === 'formal_berita' && <Newspaper className="w-3.5 h-3.5" />}
            {t.styleLabel} {styleLocalizedName} ({styleLocalizedBadge})
          </span>

          <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 font-cairo">
            {speakers && speakers.length > 0 ? (
              <>
                {t.dialogLabel}:{' '}
                <strong className="text-zinc-200">
                  {speakers.map((s) => `${s.name} (${s.voiceName})`).join(' · ')}
                </strong>
              </>
            ) : (
              <>
                {t.voiceLabel} <strong className="text-zinc-200">{voiceName}</strong>
              </>
            )}
          </span>

          <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 font-cairo">
            {t.speedLabel} <strong className="text-zinc-200">{tempoName}</strong>
          </span>

          {customDirective && (
            <span className="text-xs text-amber-300/90 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40 font-cairo max-w-full truncate">
              {t.customExpressionLabel} {customDirective}
            </span>
          )}

        </div>

        <div className={`flex flex-wrap items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={handleCopyText}
            className="text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer"
            title={t.copyTextBtn}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? t.copiedBtn : t.copyTextBtn}
          </button>

          <DownloadButtons audioBase64={audioBase64} meta={downloadMeta} t={t} variant="full" />
          {onSaveToKoleksi && (
            <button
              type="button"
              onClick={onSaveToKoleksi}
              className="text-xs font-medium text-emerald-100 bg-emerald-700/70 hover:bg-emerald-600 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-cairo"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              {t.saveToKoleksiBtn}
            </button>
          )}
        </div>
      </div>

      {/* Arabic Script Snippet */}
      <div
        dir="rtl"
        className="text-sm text-zinc-200 p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 mb-4 font-arabic leading-relaxed text-right"
      >
        &ldquo;{textSnippet}&rdquo;
      </div>

      {/* Dynamic Animated Visualizer */}
      <div className="h-14 flex items-end justify-center gap-1 sm:gap-1.5 px-2 py-2 bg-zinc-950/70 border border-zinc-800/80 rounded-xl mb-4">
        {visualizerBars.map((height, idx) => (
          <div
            key={idx}
            style={{ height: `${height}%` }}
            className={`w-1.5 sm:w-2 rounded-full transition-all duration-100 ${
              isPlaying
                ? styleId === 'netral'
                  ? 'bg-emerald-400'
                  : styleId === 'gembira'
                  ? 'bg-amber-400'
                  : 'bg-indigo-400'
                : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Scrub bar & Timestamps */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          aria-label="Audio progress scrub bar"
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pt-1 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        {/* Playback action buttons */}
        <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={handleRestart}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={t.restartAudioTooltip}
            aria-label={t.restartAudioTooltip}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer ${
              styleId === 'netral'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                : styleId === 'gembira'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
            }`}
            aria-label={isPlaying ? t.pauseAudioAria : t.playAudioAria}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Volume controls */}
        <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title={isMuted ? t.unmuteAria : t.muteAria}
            aria-label={isMuted ? t.unmuteAria : t.muteAria}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 sm:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            aria-label="Volume slider"
          />
        </div>
      </div>
    </div>
  );
};
