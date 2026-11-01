import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { TranslationSchema } from '../utils/i18n';
import { AudioMeta, downloadAudio, downloadAudioMp3 } from '../utils/audio-meta';

interface DownloadButtonsProps {
  audioBase64: string;
  meta: AudioMeta;
  t: TranslationSchema;
  /** 'full' = tombol besar (pemutar); 'compact' = tombol kecil (riwayat, perbandingan) */
  variant?: 'full' | 'compact';
}

/** Tombol unduh MP3 (ukuran kecil) dan WAV (kualitas asli). */
export const DownloadButtons: React.FC<DownloadButtonsProps> = ({ audioBase64, meta, t, variant = 'compact' }) => {
  const [busy, setBusy] = useState(false);

  const handleMp3 = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadAudioMp3(audioBase64, meta);
    } catch (err) {
      console.error('MP3 error:', err);
      window.alert(t.mp3Failed);
    } finally {
      setBusy(false);
    }
  };

  const handleWav = () => downloadAudio(audioBase64, meta);

  if (variant === 'full') {
    return (
      <>
        <button
          type="button"
          onClick={handleMp3}
          disabled={busy}
          title={t.downloadMp3Hint}
          className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-1 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {busy ? t.mp3Working : t.downloadMp3Btn}
        </button>
        <button
          type="button"
          onClick={handleWav}
          title={t.downloadWavHint}
          className="text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          WAV
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleMp3}
        disabled={busy}
        title={`${t.downloadMp3Btn} — ${t.downloadMp3Hint}`}
        className="px-1.5 py-1 text-[10px] font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/40 border border-indigo-500/30 rounded transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        MP3
      </button>
      <button
        type="button"
        onClick={handleWav}
        title={`${t.downloadWavBtn} — ${t.downloadWavHint}`}
        className="px-1.5 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 rounded transition-colors cursor-pointer flex items-center gap-1"
      >
        <Download className="w-3 h-3" />
        WAV
      </button>
    </>
  );
};
