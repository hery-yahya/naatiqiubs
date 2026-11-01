/**
 * Kode bersama untuk semua fungsi server di folder server/routes.
 *
 * Memanggil Gemini langsung lewat REST API (tanpa SDK) supaya ringan
 * dan pasti berjalan di Cloudflare.
 */

import { TTS_MODEL, AI_TEXT_MODEL } from '../src/utils/tts-helper';

export { TTS_MODEL, AI_TEXT_MODEL };

/**
 * Pengaturan dari Cloudflare.
 * - GEMINI_API_KEY: Secret yang dipasang di Settings > Variables and Secrets.
 * - APP_PASSWORD: Secret berisi sandi masuk aplikasi (opsional, tapi sangat disarankan).
 * - ASSETS: file tampilan (folder dist), disediakan otomatis oleh wrangler.jsonc.
 */
export interface Env {
  GEMINI_API_KEY?: string;
  /** Sandi masuk aplikasi (Secret). Kalau kosong, aplikasi terbuka tanpa sandi. */
  APP_PASSWORD?: string;
  /** Sandi guru (Secret): wajib untuk menyimpan/menghapus audio di Koleksi. */
  TEACHER_PASSWORD?: string;
  /** URL aplikasi web Google Apps Script (jembatan ke Google Drive). */
  DRIVE_SCRIPT_URL?: string;
  /** Kunci rahasia yang sama dengan KUNCI_RAHASIA di Apps Script. */
  DRIVE_SCRIPT_TOKEN?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

/** Data yang diterima setiap fungsi di folder server/routes. */
export interface PagesContext {
  request: Request;
  env: Env;
}

/** Batas panjang teks yang diterima server (sama dengan batas di tampilan). */
export const MAX_TEXT_CHARS = 2000;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export type ErrorCode =
  | 'NO_API_KEY'
  | 'QUOTA_EXHAUSTED'
  | 'AUTH_ERROR'
  | 'BAD_REQUEST'
  | 'SAFETY_BLOCKED'
  | 'SERVICE_UNAVAILABLE'
  | 'TTS_ERROR';

/** Error yang sudah diterjemahkan menjadi pesan yang mudah dipahami. */
export class GeminiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public httpStatus: number
  ) {
    super(message);
  }
}

const MESSAGES: Record<ErrorCode, string> = {
  NO_API_KEY:
    'Kunci API Gemini belum dipasang. Pasang GEMINI_API_KEY di Cloudflare: Settings > Variables and Secrets, lalu deploy ulang.',
  QUOTA_EXHAUSTED:
    'Kuota Gemini API sedang habis (429). Tunggu beberapa saat atau sampai kuota harian pulih, lalu coba lagi.',
  AUTH_ERROR:
    'Kunci API Gemini ditolak (tidak valid atau tidak punya izin). Periksa GEMINI_API_KEY di pengaturan Cloudflare.',
  BAD_REQUEST:
    'Gemini tidak bisa memproses teks ini. Coba persingkat teks atau periksa kembali isinya.',
  SAFETY_BLOCKED: 'Gemini menolak memproses teks ini karena alasan keamanan konten. Coba ubah teksnya.',
  SERVICE_UNAVAILABLE: 'Layanan Gemini sedang sibuk atau gangguan. Coba lagi beberapa saat lagi.',
  TTS_ERROR: 'Terjadi kesalahan pada layanan Gemini.',
};

export function makeError(code: ErrorCode, httpStatus: number, detail?: string): GeminiError {
  const msg = detail ? `${MESSAGES[code]} (${detail})` : MESSAGES[code];
  return new GeminiError(code, msg, httpStatus);
}

/** Ambil kunci API; lempar error jelas kalau belum dipasang. */
export function requireApiKey(env: Env): string {
  const key = (env.GEMINI_API_KEY || '').trim();
  if (!key) throw makeError('NO_API_KEY', 503);
  return key;
}

/** Ubah balasan error dari Gemini menjadi GeminiError yang jelas. */
async function toGeminiError(res: Response): Promise<GeminiError> {
  let status = '';
  let reason = '';
  let message = '';
  try {
    const body: any = await res.json();
    status = body?.error?.status || '';
    message = body?.error?.message || '';
    reason = JSON.stringify(body?.error?.details || '');
  } catch {
    // balasan bukan JSON; abaikan
  }

  if (res.status === 429 || status === 'RESOURCE_EXHAUSTED') {
    return makeError('QUOTA_EXHAUSTED', 429);
  }
  if (
    res.status === 401 ||
    res.status === 403 ||
    status === 'PERMISSION_DENIED' ||
    status === 'UNAUTHENTICATED' ||
    reason.includes('API_KEY_INVALID') ||
    message.includes('API key not valid')
  ) {
    return makeError('AUTH_ERROR', 502);
  }
  if (res.status === 400) {
    return makeError('BAD_REQUEST', 400, message ? message.slice(0, 200) : undefined);
  }
  if (res.status >= 500) {
    return makeError('SERVICE_UNAVAILABLE', 503);
  }
  return makeError('TTS_ERROR', 502, `HTTP ${res.status}`);
}

/** Panggil endpoint generateContent Gemini. */
async function callGenerateContent(apiKey: string, model: string, body: unknown): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw makeError('SERVICE_UNAVAILABLE', 503);
  }

  if (!res.ok) throw await toGeminiError(res);
  return res.json();
}

function checkBlocked(data: any): void {
  const finish = data?.candidates?.[0]?.finishReason;
  if (data?.promptFeedback?.blockReason || finish === 'SAFETY' || finish === 'PROHIBITED_CONTENT') {
    throw makeError('SAFETY_BLOCKED', 422);
  }
}

/** Ubah teks menjadi suara. Mengembalikan audio (base64) dan jenis filenya. */
export async function synthesizeSpeech(
  apiKey: string,
  text: string,
  style: string,
  voiceName: string
): Promise<{ audioBase64: string; mimeType: string }> {
  const data = await callGenerateContent(apiKey, TTS_MODEL, {
    contents: [
      {
        role: 'user',
        parts: [{ text, speechMetadata: { style } }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
    },
  });

  return extractAudio(data);
}

/** Ambil audio dari balasan Gemini (dan pastikan formatnya WAV). */
function extractAudio(data: any): { audioBase64: string; mimeType: string } {
  checkBlocked(data);
  const part = data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
  if (!part) {
    throw makeError('TTS_ERROR', 502, 'Gemini tidak mengirimkan audio');
  }

  const mimeType: string = part.inlineData.mimeType || 'audio/wav';
  if (!mimeType.toLowerCase().includes('wav')) {
    // Model gemini-3.8-flash-tts mengirim WAV. Kalau suatu saat model lain
    // mengirim audio mentah (PCM), bungkus dengan header WAV agar bisa diputar.
    return { audioBase64: pcmBase64ToWavBase64(part.inlineData.data, mimeType), mimeType: 'audio/wav' };
  }
  return { audioBase64: part.inlineData.data, mimeType: 'audio/wav' };
}

/** Satu giliran bicara dalam dialog. */
export interface DialogTurn {
  speakerId: string;
  text: string;
  style: string;
}

/**
 * Ubah dialog dua tokoh menjadi satu audio.
 * Setiap giliran adalah satu "part" dengan speechMetadata.speaker, dan setiap
 * speakerId dipetakan ke satu suara bawaan Gemini (maksimal 2 pembicara).
 */
export async function synthesizeDialog(
  apiKey: string,
  turns: DialogTurn[],
  speakers: { speakerId: string; voiceName: string }[]
): Promise<{ audioBase64: string; mimeType: string }> {
  const data = await callGenerateContent(apiKey, TTS_MODEL, {
    contents: [
      {
        role: 'user',
        parts: turns.map((t) => ({
          text: t.text,
          speechMetadata: { speaker: t.speakerId, style: t.style },
        })),
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map((s) => ({
            speaker: s.speakerId,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voiceName } },
          })),
        },
      },
    },
  });
  return extractAudio(data);
}

/** Minta teks dari model Gemini biasa (untuk harakat, buat naskah, dll). */
export async function generateText(
  apiKey: string,
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const data = await callGenerateContent(apiKey, AI_TEXT_MODEL, body);
  checkBlocked(data);
  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => typeof p?.text === 'string' && !p?.thought)
    .map((p) => p.text)
    .join('')
    .trim();
  if (!text) throw makeError('TTS_ERROR', 502, 'Gemini tidak mengirimkan teks');
  return text;
}

/* ------------------------------------------------------------------ */
/* Pembantu umum                                                       */
/* ------------------------------------------------------------------ */

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/** Balasan error standar yang dibaca oleh tampilan aplikasi. */
export function errorResponse(err: unknown): Response {
  if (err instanceof GeminiError) {
    return json(
      {
        success: false,
        error: err.message,
        code: err.code,
        isQuota: err.code === 'QUOTA_EXHAUSTED',
      },
      err.httpStatus
    );
  }
  console.error('Unexpected error:', err);
  return json({ success: false, error: MESSAGES.TTS_ERROR, code: 'TTS_ERROR', isQuota: false }, 500);
}

/** Baca isi permintaan JSON dengan aman. */
export async function readJson(request: Request): Promise<Record<string, any>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, any>) : {};
  } catch {
    return {};
  }
}

/** Ambil dan periksa teks dari permintaan. */
export function readText(value: unknown, emptyMessage: string, maxChars = MAX_TEXT_CHARS): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new GeminiError('BAD_REQUEST', emptyMessage, 400);
  if (text.length > maxChars) {
    throw new GeminiError(
      'BAD_REQUEST',
      `Teks terlalu panjang (${text.length} karakter). Maksimal ${maxChars} karakter.`,
      400
    );
  }
  return text;
}

/** Batas teks untuk naskah dialog (isi + nama tokoh). */
export const MAX_DIALOG_SCRIPT_CHARS = 4000;

/** Aturan tambahan agar AI menjaga format naskah dialog "Nama: teks". */
export const DIALOG_FORMAT_RULE =
  'النص حوار بين شخصين. حافظ على بنية الأسطر كما هي تمامًا: كل سطر يبدأ باسم المتحدث ثم نقطتين (:) ثم كلامه، ' +
  'ويمكن أن يكون بعد الاسم وصف للتعبير بين قوسين. لا تغيّر الأسماء ولا ما بين القوسين، ولا تدمج الأسطر ولا تحذفها.';

export function isDialogFormat(body: Record<string, any>): boolean {
  return body.format === 'dialog';
}

/* ------------------------------------------------------------------ */
/* Cadangan: bungkus PCM mentah menjadi WAV                             */
/* ------------------------------------------------------------------ */

function pcmBase64ToWavBase64(pcmBase64: string, mimeType: string): string {
  const rateMatch = /rate=(\d+)/i.exec(mimeType);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const pcm = base64ToBytes(pcmBase64);

  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  writeStr(36, 'data');
  v.setUint32(40, pcm.length, true);

  const out = new Uint8Array(44 + pcm.length);
  out.set(new Uint8Array(header), 0);
  out.set(pcm, 44);
  return bytesToBase64(out);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
