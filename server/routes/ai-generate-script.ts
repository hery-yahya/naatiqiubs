import {
  errorResponse,
  generateText,
  isDialogFormat,
  json,
  PagesContext,
  readJson,
  readText,
  requireApiKey,
} from '../gemini';
import { STYLE_CONFIGS, TTSStyleId } from '../../src/utils/tts-helper';

// POST /api/ai/generate-script — buat naskah Arab fusha berharakat dari sebuah topik.
// format: 'dialog' → percakapan dua tokoh dengan format "Nama: teks" per baris.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const prompt = readText(body.prompt, 'Silakan tulis topik atau ide naskah terlebih dahulu.');
    const styleId: TTSStyleId = STYLE_CONFIGS[body.styleId as TTSStyleId] ? body.styleId : 'netral';
    const styleInfo = STYLE_CONFIGS[styleId];
    const apiKey = requireApiKey(env);

    const instruction = isDialogFormat(body)
      ? `أنت كاتب حوارات تعليمية محترف باللغة العربية الفصحى لطلاب المدارس الإسلامية. اكتب حوارًا قصيرًا طبيعيًا (من 6 إلى 10 أسطر) بين شخصين اثنين فقط، مشكولًا بالحركات الإعرابية التامة بدقة، ليُحوَّل إلى صوت.
الموضوع أو الفكرة المطلوبة: "${prompt}".
نمط الإلقاء العام: ${styleInfo.nameArabic}.
قواعد الشكل (مهمة جدًا):
- كل سطر يبدأ باسم المتحدث (اسم عربي بسيط بدون تشكيل) ثم نقطتين ":" ثم كلامه، مثل: أحمد: السَّلَامُ عَلَيْكُمْ.
- يمكن أن تضع وصفًا قصيرًا للتعبير بين قوسين بعد الاسم عند الحاجة، مثل: فاطمة (بفرح): ...
- اسمان فقط في الحوار كله، وكل سطر في سطر مستقل.
- بدون عنوان أو مقدمة أو شرح أو علامات اقتباس. أعد الحوار مباشرة فقط.`
      : `أنت كاتب ومعد نصوص محترف باللغة العربية الفصحى. اكتب نصًا صوتيًا فصيحًا ومؤثرًا (بين 25 إلى 60 كلمة) ومشكولًا بالحركات الإعرابية التامة بدقة، ليكون مخصصًا للإلقاء الصوتي عبر تحويل النص إلى صوت (TTS).
الموضوع أو الفكرة المطلوبة: "${prompt}".
نمط الإلقاء المستهدف: ${styleInfo.nameArabic} (${styleInfo.directive}).
ملاحظة هامة: يجب أن يكون النص باللغة العربية الفصحى الراقية، مضبوطًا بالحركات، وبدون أي عبارات تقديمية مثل "إليك النص" أو علامات اقتباس. أعد النص المباشر فقط.`;

    const result = await generateText(apiKey, instruction);
    return json({ success: true, generatedScript: result, styleId });
  } catch (err) {
    return errorResponse(err);
  }
};
