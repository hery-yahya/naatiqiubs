/**
 * Info audio untuk riwayat dan file unduhan.
 *
 * Setiap file unduhan:
 * 1. diberi nama yang langsung terbaca, misalnya
 *    Naatiq_2026-11-01_0636_Kore-Wanita_Netral_Lambat_اهلا-وسهلا-بكم.wav
 * 2. diberi label di dalam file WAV (judul, suara, keterangan lengkap) yang
 *    terlihat di pemutar musik dan di Properties/Info file.
 */

import { STYLE_CONFIGS, TTSStyleId, TempoId, AVAILABLE_VOICES } from './tts-helper';

export interface AudioMeta {
  text: string;
  styleId: TTSStyleId;
  voiceName: string;
  tempo?: TempoId;
  customDirective?: string;
  timestamp: number;
}

/** Nama gaya dan tempo dalam Bahasa Indonesia (tetap sama apa pun bahasa tampilan). */
export const STYLE_NAMES_ID: Record<TTSStyleId, string> = {
  netral: 'Netral',
  gembira: 'Gembira',
  formal_berita: 'Formal Berita',
};

export const TEMPO_NAMES_ID: Record<TempoId, string> = {
  normal: 'Normal',
  lambat: 'Lambat',
  eja: 'Lambat + Jeda',
};

export function voiceLabel(voiceName: string): string {
  const v = AVAILABLE_VOICES.find((x) => x.id === voiceName);
  if (!v) return voiceName;
  return `${v.name} (${v.gender.includes('أنثى') ? 'Wanita' : 'Pria'})`;
}

/** Hapus harakat & tatweel agar penggalan teks rapi dipakai sebagai nama file. */
export function stripHarakat(text: string): string {
  return text.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '');
}

/** Penggalan beberapa kata pertama dari teks. */
export function textSnippet(text: string, maxWords = 4): string {
  const words = stripHarakat(text).replace(/[«»"“”'‘’.,،؛;:!?؟()[\]{}]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const snippet = words.slice(0, maxWords).join(' ');
  return words.length > maxWords ? `${snippet}…` : snippet;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function stamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Ubah teks menjadi potongan aman untuk nama file. */
function slug(text: string, maxLen: number): string {
  return text
    .replace(/…/g, '')
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, maxLen)
    .replace(/-+$/, '');
}

/**
 * Nama file unduhan:
 * Naatiq_<tanggal>_<jam>_<suara>_<gaya>_<tempo>[_ekspresi-...]_<penggalan teks>.wav
 * Tanggal di depan agar file tersusun urut waktu; teks Arab di akhir agar tampilan nama tetap rapi.
 */
export function buildFileName(meta: AudioMeta, ext = 'wav'): string {
  const v = AVAILABLE_VOICES.find((x) => x.id === meta.voiceName);
  const parts = [
    'Naatiq',
    stamp(meta.timestamp),
    v ? `${v.name}-${v.gender.includes('أنثى') ? 'Wanita' : 'Pria'}` : slug(meta.voiceName, 20),
    slug(STYLE_NAMES_ID[meta.styleId] || meta.styleId, 20),
    slug(TEMPO_NAMES_ID[meta.tempo || 'normal'], 20),
  ];
  const custom = (meta.customDirective || '').trim();
  if (custom) parts.push(`ekspresi-${slug(textSnippet(custom, 3), 24)}`);
  parts.push(slug(textSnippet(meta.text), 40) || 'audio');
  return `${parts.filter(Boolean).join('_')}.${ext}`;
}

/** Waktu yang mudah dibaca, misalnya "1 Nov 2026, 06.36". */
export function formatDateTime(ts: number, locale = 'id-ID'): string {
  try {
    return new Date(ts).toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

/** Keterangan lengkap (dipakai sebagai komentar di dalam file WAV). */
export function buildDescription(meta: AudioMeta): string {
  const lines = [
    `Teks: ${meta.text}`,
    `Suara: ${voiceLabel(meta.voiceName)}`,
    `Gaya ekspresi: ${STYLE_NAMES_ID[meta.styleId] || meta.styleId} (${STYLE_CONFIGS[meta.styleId]?.nameArabic || ''})`,
  ];
  const custom = (meta.customDirective || '').trim();
  if (custom) lines.push(`Ekspresi tambahan: ${custom}`);
  lines.push(`Tempo bicara: ${TEMPO_NAMES_ID[meta.tempo || 'normal']}`);
  lines.push(`Dibuat: ${formatDateTime(meta.timestamp)}`);
  lines.push('Aplikasi: Nāṭiq IUBS (Gemini TTS)');
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Label di dalam file WAV (RIFF LIST/INFO)                             */
/* ------------------------------------------------------------------ */

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function ascii(bytes: Uint8Array, offset: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[offset + i]);
  return s;
}

function infoSubChunk(id: string, value: string): Uint8Array {
  const text = new TextEncoder().encode(value);
  const size = text.length + 1; // diakhiri byte nol
  const padded = size + (size % 2);
  const out = new Uint8Array(8 + padded);
  const view = new DataView(out.buffer);
  for (let i = 0; i < 4; i++) out[i] = id.charCodeAt(i);
  view.setUint32(4, size, true);
  out.set(text, 8);
  return out;
}

function buildInfoChunk(meta: AudioMeta): Uint8Array {
  const subs = [
    infoSubChunk('INAM', `${textSnippet(meta.text, 6)} — ${STYLE_NAMES_ID[meta.styleId]}, ${TEMPO_NAMES_ID[meta.tempo || 'normal']}`),
    infoSubChunk('IART', `Nāṭiq — ${voiceLabel(meta.voiceName)}`),
    infoSubChunk('ICMT', buildDescription(meta)),
    infoSubChunk('ICRD', stamp(meta.timestamp).slice(0, 10)),
    infoSubChunk('ISFT', 'Nāṭiq IUBS — Gemini 3.8 Flash TTS'),
    infoSubChunk('IGNR', 'Bahasa Arab Fusha'),
  ];
  const bodyLen = 4 + subs.reduce((n, s) => n + s.length, 0);
  const out = new Uint8Array(8 + bodyLen);
  const view = new DataView(out.buffer);
  out.set([0x4c, 0x49, 0x53, 0x54], 0); // "LIST"
  view.setUint32(4, bodyLen, true);
  out.set([0x49, 0x4e, 0x46, 0x4f], 8); // "INFO"
  let pos = 12;
  for (const s of subs) {
    out.set(s, pos);
    pos += s.length;
  }
  return out;
}

/**
 * Tambahkan label INFO ke file WAV. Label disisipkan sebelum bagian data audio,
 * sehingga audionya sendiri tidak berubah. Kalau formatnya tidak dikenali,
 * file dikembalikan apa adanya.
 */
export function wavWithInfo(audioBase64: string, meta: AudioMeta): Uint8Array {
  const wav = base64ToBytes(audioBase64);
  try {
    if (wav.length < 12 || ascii(wav, 0, 4) !== 'RIFF' || ascii(wav, 8, 4) !== 'WAVE') return wav;
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);

    // Cari bagian "data"; buang LIST lama kalau ada.
    let pos = 12;
    let dataOffset = -1;
    const keep: Uint8Array[] = [];
    while (pos + 8 <= wav.length) {
      const id = ascii(wav, pos, 4);
      const size = view.getUint32(pos + 4, true);
      if (id === 'data') {
        dataOffset = pos;
        break;
      }
      const end = pos + 8 + size + (size % 2);
      if (end > wav.length) return wav;
      if (id !== 'LIST') keep.push(wav.subarray(pos, end));
      pos = end;
    }
    if (dataOffset < 0) return wav;

    const info = buildInfoChunk(meta);
    const dataPart = wav.subarray(dataOffset);
    const headerChunks = keep.reduce((n, c) => n + c.length, 0);
    const total = 12 + headerChunks + info.length + dataPart.length;

    const out = new Uint8Array(total);
    out.set(wav.subarray(0, 12), 0);
    let o = 12;
    for (const c of keep) {
      out.set(c, o);
      o += c.length;
    }
    out.set(info, o);
    o += info.length;
    out.set(dataPart, o);
    new DataView(out.buffer).setUint32(4, total - 8, true);
    return out;
  } catch {
    return wav;
  }
}

/** Unduh audio dengan nama file dan label lengkap. */
export function downloadAudio(audioBase64: string, meta: AudioMeta): void {
  const bytes = wavWithInfo(audioBase64, meta);
  const blob = new Blob([bytes as BlobPart], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildFileName(meta);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
