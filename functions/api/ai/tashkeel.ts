import { errorResponse, generateText, json, PagesContext, readJson, readText, requireApiKey } from '../../../server/gemini';

// POST /api/ai/tashkeel — beri harakat lengkap pada teks Arab.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    const text = readText(body.text, 'Silakan tulis teks bahasa Arab yang ingin diberi harakat.');
    const apiKey = requireApiKey(env);

    const result = await generateText(
      apiKey,
      `أنت عالم لغوي وخبير في النحو والصرف العربي. قم بضبط وتشكيل النص العربي التالي تشكيلًا إعرابيًا كاملًا ودقيقًا بالحركات (الفتحة، الضمة، الكسرة، السكون، التنوين، الشدة) ليكون معدًا للنطق الصوتي الفصيح التام. لا تضف أي نص أو مقدمات أو شرح؛ أعد فقط النص مشكولًا:
${text}`,
      'أعد النص العربي مشكولاً بالحركات الإعرابية التامة فقط دون أي زيادات أو مقدمات أو خاتمة.'
    );

    return json({ success: true, textWithTashkeel: result });
  } catch (err) {
    return errorResponse(err);
  }
};
