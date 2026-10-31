import { errorResponse, generateText, json, PagesContext, readJson, readText, requireApiKey } from '../../../server/gemini';
import { STYLE_CONFIGS, TTSStyleId } from '../../../src/utils/tts-helper';

// POST /api/ai/enhance-fusha — ubah teks (Indonesia, Inggris, 'amiyah, dll) menjadi Arab fusha berharakat.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const text = readText(body.text, 'Silakan tulis teks yang ingin diubah ke bahasa Arab fusha.');
    const styleId: TTSStyleId = STYLE_CONFIGS[body.targetStyle as TTSStyleId] ? body.targetStyle : 'netral';
    const styleInfo = STYLE_CONFIGS[styleId];
    const apiKey = requireApiKey(env);

    const result = await generateText(
      apiKey,
      `قم بتحويل وإعادة صياغة وترجمة النص التالي (سواء كان بالعربية العامية، الإندونيسية، الإنجليزية، أو صياغة عربية بسيطة) إلى نص باللغة العربية الفصحى البليغة والمضبوطة ضبطًا إعرابيًا كاملًا بالحركات (تشكيل تام)، ليتناسب مع الإلقاء الصوتي بنمط (${styleInfo.nameArabic}).
النص الأصلي:
"${text}"
أعد فقط النص العربي الفصيح المشكول مباشرة دون أي شروحات أو مقدمات.`
    );

    return json({ success: true, enhancedScript: result });
  } catch (err) {
    return errorResponse(err);
  }
};
