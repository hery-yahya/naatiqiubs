import { json, PagesContext, TTS_MODEL, AI_TEXT_MODEL } from '../../server/gemini';
import { STYLE_CONFIGS } from '../../src/utils/tts-helper';

// GET /api/status — dipakai tampilan untuk menampilkan status "Terhubung".
export const onRequestGet = async ({ env }: PagesContext): Promise<Response> => {
  return json({
    status: 'ok',
    hasKey: Boolean((env.GEMINI_API_KEY || '').trim()),
    model: TTS_MODEL,
    aiModel: AI_TEXT_MODEL,
    language: 'Arabic Fusha (العربية الفصحى)',
    styles: Object.keys(STYLE_CONFIGS),
  });
};
