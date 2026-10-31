import {
  errorResponse,
  json,
  PagesContext,
  readJson,
  readText,
  requireApiKey,
  synthesizeSpeech,
  TTS_MODEL,
} from '../../../server/gemini';
import { AVAILABLE_VOICES, buildSpeechDirective, STYLE_CONFIGS, TTSStyleId } from '../../../src/utils/tts-helper';

// POST /api/tts/generate — ubah teks Arab menjadi suara dengan satu gaya.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const text = readText(body.text, 'Silakan tulis teks bahasa Arab fusha terlebih dahulu.');

    const styleId: TTSStyleId = STYLE_CONFIGS[body.styleId as TTSStyleId] ? body.styleId : 'netral';
    const voiceName = AVAILABLE_VOICES.some((v) => v.id === body.voiceName) ? body.voiceName : 'Kore';
    const customDirective =
      typeof body.customDirective === 'string' ? body.customDirective.slice(0, 500) : undefined;
    const directive = buildSpeechDirective(styleId, customDirective);

    const apiKey = requireApiKey(env);
    const { audioBase64, mimeType } = await synthesizeSpeech(apiKey, text, directive, voiceName);

    return json({
      success: true,
      audioBase64,
      mimeType,
      styleId,
      voiceName,
      text,
      directive,
      modelUsed: TTS_MODEL,
    });
  } catch (err) {
    return errorResponse(err);
  }
};
