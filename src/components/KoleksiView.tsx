import React, { useEffect, useState } from 'react';
import {
  Library,
  RefreshCw,
  Loader2,
  Play,
  X,
  Link2,
  Check,
  Share2,
  ExternalLink,
  Trash2,
  Folder,
  Search,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { TranslationSchema, AppLanguage, fill } from '../utils/i18n';
import { apiPost } from '../utils/api';
import { formatDateTime } from '../utils/audio-meta';
import { copyText, displayName, shareToWhatsApp } from '../utils/share';
import { TeacherLogin } from './TeacherLogin';

export interface KoleksiItem {
  id: string;
  name: string;
  folder: string;
  url: string;
  previewUrl: string;
  created: number;
  size: number;
  description: string;
}

interface KoleksiViewProps {
  t: TranslationSchema;
  language: AppLanguage;
  koleksiEnabled: boolean;
  teacherPasswordSet: boolean;
  isTeacher: boolean;
  onTeacherLogout: () => void;
}

/** Ringkas keterangan file menjadi satu baris: tokoh/suara · gaya · tempo. */
function summary(description: string): string {
  const keep = ['Tokoh:', 'Suara:', 'Gaya ekspresi:', 'Tempo bicara:'];
  return description
    .split('\n')
    .filter((l) => keep.some((k) => l.startsWith(k)))
    .map((l) => l.replace(/^[^:]+:\s*/, ''))
    .join(' · ');
}

export const KoleksiView: React.FC<KoleksiViewProps> = ({
  t,
  language,
  koleksiEnabled,
  teacherPasswordSet,
  isTeacher,
  onTeacherLogout,
}) => {
  const [items, setItems] = useState<KoleksiItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [folderUrl, setFolderUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string>('__all__');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isArabicUI = language === 'ar';
  const locale = language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : 'id-ID';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { res, data } = await apiPost('/api/koleksi/list', {});
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal memuat Koleksi.');
      setItems(data.items || []);
      setFolders(data.folders || []);
      setFolderUrl(data.folderUrl || '');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat Koleksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (koleksiEnabled) load();
  }, [koleksiEnabled]);

  const handleCopy = async (item: KoleksiItem) => {
    if (await copyText(item.url)) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      window.prompt(t.koleksiCopyLink, item.url);
    }
  };

  const handleDelete = async (item: KoleksiItem) => {
    if (!window.confirm(fill(t.koleksiDeleteConfirm, { name: displayName(item.name) }))) return;
    setDeletingId(item.id);
    try {
      const { res, data } = await apiPost('/api/koleksi/delete', { id: item.id }, { teacher: true });
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menghapus.');
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      if (playingId === item.id) setPlayingId(null);
    } catch (err: any) {
      window.alert(err.message || 'Gagal menghapus.');
    } finally {
      setDeletingId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (it) =>
      (folderFilter === '__all__' || it.folder === folderFilter) &&
      (!q || it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q))
  );

  if (!koleksiEnabled) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center space-y-2 font-cairo">
        <Library className="w-8 h-8 text-zinc-600 mx-auto" />
        <h2 className="text-base font-bold text-zinc-200">{t.koleksiTitle}</h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">{t.koleksiNotConfigured}</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4" dir={isArabicUI ? 'rtl' : 'ltr'}>
      {/* Judul */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-cairo">
            <Library className="w-5 h-5 text-indigo-400" />
            {t.koleksiTitle}
            <span className="text-xs font-normal text-zinc-500">· {fill(t.koleksiCount, { count: items.length })}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-cairo">{t.koleksiSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {folderUrl && isTeacher && (
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1 font-cairo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.koleksiOpenDrive}
            </a>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1 disabled:opacity-50 cursor-pointer font-cairo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t.koleksiRefresh}
          </button>
        </div>
      </div>

      {/* Mode guru */}
      {teacherPasswordSet && (
        <div className="p-2.5 rounded-lg border border-amber-800/40 bg-amber-950/20">
          {isTeacher ? (
            <div className="flex items-center justify-between gap-2 text-xs font-cairo">
              <span className="text-amber-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                {t.teacherBadge}
              </span>
              <button type="button" onClick={onTeacherLogout} className="text-zinc-400 hover:text-zinc-200 underline cursor-pointer">
                {t.teacherLogout}
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-amber-200/80 font-cairo">{t.koleksiOnlyTeacher}</p>
              <TeacherLogin t={t} />
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[10rem]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute top-1/2 -translate-y-1/2 left-2.5" />
          <input
            type="text"
            dir="auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.koleksiSearch}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="__all__">{t.koleksiAllFolders}</option>
          <option value="">{t.koleksiRootFolder}</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Isi */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-start gap-2 font-cairo">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 py-8 font-cairo">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t.koleksiLoading}
        </div>
      ) : !error && visible.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8 font-cairo">{t.koleksiEmpty}</p>
      ) : (
        <ul className="divide-y divide-zinc-800/80">
          {visible.map((item) => {
            const info = summary(item.description);
            const isPlaying = playingId === item.id;
            return (
              <li key={item.id} className="py-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-100 font-semibold break-words" dir="auto">
                      {displayName(item.name)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-zinc-500 font-cairo">
                      <span className="inline-flex items-center gap-1 px-1.5 rounded border border-zinc-700 text-zinc-400">
                        <Folder className="w-3 h-3" />
                        {item.folder || t.koleksiRootFolder}
                      </span>
                      <span>{formatDateTime(item.created, locale)}</span>
                      <span>{Math.max(1, Math.round(item.size / 1024))} KB</span>
                    </div>
                    {info && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate" dir="auto">
                        {info}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPlayingId(isPlaying ? null : item.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer font-cairo ${
                        isPlaying ? 'bg-zinc-700 text-white' : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isPlaying ? <X className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      {isPlaying ? t.koleksiClosePlayer : t.koleksiPlay}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="text-xs px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1 cursor-pointer font-cairo"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                      {copiedId === item.id ? t.koleksiCopied : t.koleksiCopyLink}
                    </button>
                    <button
                      type="button"
                      onClick={() => shareToWhatsApp(t.shareMessage, displayName(item.name), item.url)}
                      className="text-xs px-2 py-1 rounded-lg border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/30 flex items-center gap-1 cursor-pointer font-cairo"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t.koleksiShareWa}
                    </button>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        title={t.koleksiDelete}
                        className="text-xs p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 disabled:opacity-50 cursor-pointer"
                      >
                        {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {isPlaying && (
                  <iframe
                    src={item.previewUrl}
                    title={displayName(item.name)}
                    allow="autoplay"
                    className="w-full h-24 rounded-lg border border-zinc-800 bg-zinc-950"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
