import React, { useState } from 'react';
import {
  ListMusic,
  Trash2,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Smile,
  Newspaper,
} from 'lucide-react';
import { TTSStyleId, STYLE_CONFIGS } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage } from '../utils/i18n';

export interface HistoryItem {
  id: string;
  timestamp: number;
  text: string;
  styleId: TTSStyleId;
  voiceName: string;
  audioBase64: string;
}

interface HistoryListProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onLoadTextToEditor: (text: string) => void;
  t: TranslationSchema;
  language: AppLanguage;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onClearHistory,
  onSelectHistoryItem,
  onLoadTextToEditor,
  t,
  language,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayToggle = (item: HistoryItem) => {
    if (playingId === item.id) {
      if (activeAudio) {
        activeAudio.pause();
      }
      setPlayingId(null);
    } else {
      if (activeAudio) {
        activeAudio.pause();
      }
      const newAudio = new Audio(`data:audio/wav;base64,${item.audioBase64}`);
      newAudio.onended = () => setPlayingId(null);
      newAudio.play().then(() => {
        setPlayingId(item.id);
        setActiveAudio(newAudio);
      });
    }
  };

  const handleDownload = (item: HistoryItem) => {
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${item.audioBase64}`;
    link.download = `gemini-arabic-${item.styleId}-${item.voiceName.toLowerCase()}-${item.id.slice(0, 6)}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) {
    return null;
  }

  const isArabicUI = language === 'ar';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div
        className={`flex items-center justify-between ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          <ListMusic className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-300 font-cairo">
            {t.historyTitle} ({history.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          {t.clearHistoryBtn}
        </button>
      </div>

      <div className="divide-y divide-zinc-800/80 max-h-60 overflow-y-auto pr-1">
        {history.map((item) => {
          const cfg = STYLE_CONFIGS[item.styleId] || STYLE_CONFIGS.netral;
          const isPlaying = playingId === item.id;
          const timeFormatted = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          const styleName =
            item.styleId === 'netral'
              ? t.styleNetralBadge
              : item.styleId === 'gembira'
              ? t.styleGembiraBadge
              : t.styleFormalBadge;

          return (
            <div
              key={item.id}
              className={`py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-800/30 px-2 rounded-lg transition-colors ${
                isArabicUI ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`min-w-0 flex-1 ${isArabicUI ? 'text-right' : 'text-left'}`}>
                <div
                  className={`flex items-center gap-2 mb-1 ${
                    isArabicUI ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded border ${
                      item.styleId === 'netral'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.styleId === 'gembira'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {item.styleId === 'netral' && <Sparkles className="w-2.5 h-2.5" />}
                    {item.styleId === 'gembira' && <Smile className="w-2.5 h-2.5" />}
                    {item.styleId === 'formal_berita' && <Newspaper className="w-2.5 h-2.5" />}
                    {styleName}
                  </span>

                  <span className="text-[10px] text-zinc-400 font-mono">
                    {t.voiceLabel} {item.voiceName}
                  </span>

                  <span className="text-[10px] text-zinc-500 mx-2">
                    {timeFormatted}
                  </span>
                </div>

                <p dir="rtl" className="text-zinc-300 truncate text-xs font-arabic text-right">
                  {item.text}
                </p>
              </div>

              {/* Actions */}
              <div className={`flex items-center gap-1 shrink-0 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => handlePlayToggle(item)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                  title={isPlaying ? t.pauseBtn : t.playBtn}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onLoadTextToEditor(item.text)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title={t.loadToEditorTooltip}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title={t.downloadWavBtn}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
