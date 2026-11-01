import {
  DIALOG_FORMAT_RULE,
  errorResponse,
  generateText,
  isDialogFormat,
  json,
  MAX_DIALOG_SCRIPT_CHARS,
  MAX_TEXT_CHARS,
  PagesContext,
  readJson,
  readText,
  requireApiKey,
} from '../gemini';
import { STYLE_CONFIGS, TTSStyleId } from '../../src/utils/tts-helper';

// POST /api/ai/enhance-fusha — ubah teks (Indonesia, Inggris, 'amiyah, dll) menjadi Arab fusha berharakat.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const dialog = isDialogFormat(body);
    const text = readText(
      body.text,
      'Silakan tulis teks yang ingin diubah ke bahasa Arab fusha.',
      dialog ? MAX_DIALOG_SCRIPT_CHARS : MAX_TEXT_CHARS
    );
    const styleId: TTSStyleId = STYLE_CONFIGS[body.targetStyle as TTSStyleId] ? body.targetStyle : 'netral';
    const styleInfo = STYLE_CONFIGS[styleId];
    const apiKey = requireApiKey(env);

    const result = await generateText(
      apiKey,
      `قم بتحويل وإعادة صياغة وترجمة النص التالي (سواء كان بالعربية العامية، الإندونيسية، الإنجليزية، أو صياغة عربية بسيطة) إلى نص باللغة العربية الفصحى البليغة والمضبوطة ضبطًا إعرابيًا كاملًا بالحركات (تشكيل تام)، ليتناسب مع الإلقاء الصوتي بنمط (${styleInfo.nameArabic}).
النص الأصلي:
"${text}"
أعد فقط النص العربي الفصيح المشكول مباشرة دون أي شروحات أو مقدمات.${dialog ? `\n${DIALOG_FORMAT_RULE} يمكنك كتابة الأسماء بالحروف العربية.` : ''}`
    );

    return json({ success: true, enhancedScript: result });
  } catch (err) {
    return errorResponse(err);
  }
};
