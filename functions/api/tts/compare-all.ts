import {
  errorResponse,
  GeminiError,
  json,
  PagesContext,
  readJson,
  readText,
  requireApiKey,
  synthesizeSpeech,
  TTS_MODEL,
} from '../../../server/gemini';
import { AVAILABLE_VOICES, buildSpeechDirective, TTSStyleId } from '../../../src/utils/tts-helper';

const STYLES: TTSStyleId[] = ['netral', 'gembira', 'formal_berita'];

// POST /api/tts/compare-all — buat suara untuk ketiga gaya sekaligus.
// Catatan: satu klik = 3 permintaan ke Gemini (memakai kuota 3 kali).
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const text = readText(body.text, 'Silakan tulis teks bahasa Arab fusha terlebih dahulu.');
    const voiceName = AVAILABLE_VOICES.some((v) => v.id === body.voiceName) ? body.voiceName : 'Kore';
    const apiKey = requireApiKey(env);

    const results = await Promise.all(
      STYLES.map(async (styleId) => {
        const directive = buildSpeechDirective(styleId);
        try {
          const { audioBase64, mimeType } = await synthesizeSpeech(apiKey, text, directive, voiceName);
          return { styleId, success: true, audioBase64, mimeType, directive, modelUsed: TTS_MODEL };
        } catch (err) {
          const e = err instanceof GeminiError ? err : null;
          return {
            styleId,
            success: false,
            error: e ? e.message : 'Terjadi kesalahan pada layanan Gemini.',
            code: e ? e.code : 'TTS_ERROR',
            isQuota: e?.code === 'QUOTA_EXHAUSTED',
          };
        }
      })
    );

    // Kalau ketiganya gagal, laporkan sebagai error biasa agar pesannya tampil jelas.
    if (results.every((r) => !r.success)) {
      const first = results[0] as { error: string; code: string; isQuota: boolean };
      return json({ success: false, error: first.error, code: first.code, isQuota: first.isQuota }, 502);
    }

    return json({
      success: true,
      text,
      voiceName,
      modelUsed: TTS_MODEL,
      results,
      isQuotaExceeded: results.some((r) => (r as { isQuota?: boolean }).isQuota),
    });
  } catch (err) {
    return errorResponse(err);
  }
};
