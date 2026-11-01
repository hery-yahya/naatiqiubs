import React, { useEffect, useState } from 'react';
import { X, CloudUpload, Loader2, Check, Link2, Share2, ExternalLink } from 'lucide-react';
import { TranslationSchema, AppLanguage } from '../utils/i18n';
import { apiPost } from '../utils/api';
import { AudioMeta, buildDescription, bytesToBase64, makeMp3, textSnippet } from '../utils/audio-meta';
import { copyText, shareToWhatsApp } from '../utils/share';
import { TeacherLogin } from './TeacherLogin';
import type { KoleksiItem } from './KoleksiView';

interface SaveToKoleksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioBase64: string;
  meta: AudioMeta;
  isTeacher: boolean;
  teacherPasswordSet: boolean;
  t: TranslationSchema;
  language: AppLanguage;
}

const RECENT_FOLDERS_KEY = 'naatiq_recent_folders';

function loadRecentFolders(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_FOLDERS_KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string').slice(0, 10) : [];
  } catch {
    return [];
  }
}

function rememberFolder(folder: string): void {
  if (!folder) return;
  try {
    const next = [folder, ...loadRecentFolders().filter((f) => f !== folder)].slice(0, 10);
    localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(next));
  } catch {
    // abaikan
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Nama file di Drive: "<judul> (2026-11-01 13.30).mp3" */
function driveFileName(title: string, ts: number): string {
  const d = new Date(ts);
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}`;
  const clean = title.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) || 'Naatiq';
  return `${clean} (${stamp}).mp3`;
}

export const SaveToKoleksiModal: React.FC<SaveToKoleksiModalProps> = ({
  isOpen,
  onClose,
  audioBase64,
  meta,
  isTeacher,
  teacherPasswordSet,
  t,
  language,
}) => {
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<KoleksiItem | null>(null);
  const [copied, setCopied] = useState(false);
  const isArabicUI = language === 'ar';

  useEffect(() => {
    if (!isOpen) return;
    const folders = loadRecentFolders();
    setRecent(folders);
    setFolder(folders[0] || '');
    setTitle(textSnippet(meta.text, 6).replace(/…$/, ''));
    setSaved(null);
    setError(null);
    setCopied(false);
  }, [isOpen, audioBase64]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const mp3 = await makeMp3(audioBase64, meta);
      const { res, data } = await apiPost(
        '/api/koleksi/save',
        {
          base64: bytesToBase64(mp3),
          fileName: driveFileName(title, meta.timestamp),
          folder: folder.trim(),
          description: buildDescription(meta),
        },
        { teacher: true }
      );
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menyimpan ke Koleksi.');
      rememberFolder(folder.trim());
      setSaved(data.item);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan ke Koleksi.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!saved) return;
    if (await copyText(saved.url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt(t.koleksiCopyLink, saved.url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        dir={isArabicUI ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 shadow-2xl font-cairo"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-indigo-400" />
            {t.saveModalTitle}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-zinc-400 hover:text-white cursor-pointer" title={t.closeBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {!teacherPasswordSet ? (
          <p className="text-sm text-amber-300">{t.teacherNotSet}</p>
        ) : !isTeacher ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">{t.koleksiOnlyTeacher}</p>
            <p className="text-xs font-semibold text-zinc-300">{t.teacherLoginTitle}</p>
            <TeacherLogin t={t} />
          </div>
        ) : saved ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-300 flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4" />
              {t.saveDone}
            </p>
            <p className="text-xs text-zinc-400">{t.saveDoneHint}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-200 hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied ? t.koleksiCopied : t.koleksiCopyLink}
              </button>
              <button
                type="button"
                onClick={() => shareToWhatsApp(t.shareMessage, title || saved.name, saved.url)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {t.koleksiShareWa}
              </button>
              <a
                href={saved.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-200 hover:bg-zinc-800 flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t.koleksiOpenDrive}
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs text-zinc-300 font-semibold">{t.saveTitleLabel}</span>
              <input
                type="text"
                dir="auto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-300 font-semibold">{t.saveFolderLabel}</span>
              <input
                type="text"
                dir="auto"
                list="naatiq-recent-folders"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                maxLength={80}
                placeholder={t.saveFolderPlaceholder}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="naatiq-recent-folders">
                {recent.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </label>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              {saving ? t.saveSaving : t.saveSubmit}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
