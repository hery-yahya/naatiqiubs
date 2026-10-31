import { errorResponse, generateText, json, PagesContext, readJson, readText, requireApiKey } from '../gemini';
import { STYLE_CONFIGS, TTSStyleId } from '../../src/utils/tts-helper';

// POST /api/ai/generate-script — buat naskah Arab fusha berharakat dari sebuah topik.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const prompt = readText(body.prompt, 'Silakan tulis topik atau ide naskah terlebih dahulu.');
    const styleId: TTSStyleId = STYLE_CONFIGS[body.styleId as TTSStyleId] ? body.styleId : 'netral';
    const styleInfo = STYLE_CONFIGS[styleId];
    const apiKey = requireApiKey(env);

    const result = await generateText(
      apiKey,
      `أنت كاتب ومعد نصوص محترف باللغة العربية الفصحى. اكتب نصًا صوتيًا فصيحًا ومؤثرًا (بين 25 إلى 60 كلمة) ومشكولًا بالحركات الإعرابية التامة بدقة، ليكون مخصصًا للإلقاء الصوتي عبر تحويل النص إلى صوت (TTS).
الموضوع أو الفكرة المطلوبة: "${prompt}".
نمط الإلقاء المستهدف: ${styleInfo.nameArabic} (${styleInfo.directive}).
ملاحظة هامة: يجب أن يكون النص باللغة العربية الفصحى الراقية، مضبوطًا بالحركات، وبدون أي عبارات تقديمية مثل "إليك النص" أو علامات اقتباس. أعد النص المباشر فقط.`
    );

    return json({ success: true, generatedScript: result, styleId });
  } catch (err) {
    return errorResponse(err);
  }
};
