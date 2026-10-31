import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  buildSpeechDirective,
  STYLE_CONFIGS,
  TTSStyleId,
  TTS_MODEL,
  AI_TEXT_MODEL,
} from './src/utils/tts-helper.ts';
import { GeminiKeyPool, extractKeysFromEnv } from './src/utils/key-pool.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize the API Key Pool with all configured keys from env
const keyPool = new GeminiKeyPool(extractKeysFromEnv(process.env));

console.log(
  `[KeyPool] Initialized with ${keyPool.totalKeys} key(s). Auto-failover on 429 quota enabled.`
);

// Helper to create a pleasant fallback WAV chime if all keys are exhausted
function generateFallbackWav(frequency = 440, durationSeconds = 3.0): string {
  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 1.2);
    const sampleVal =
      0.5 * Math.sin(2 * Math.PI * frequency * t) +
      0.3 * Math.sin(2 * Math.PI * (frequency * 1.25) * t) +
      0.2 * Math.sin(2 * Math.PI * (frequency * 1.5) * t);
    const intSample = Math.floor(sampleVal * envelope * 16000);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, intSample)), 44 + i * 2);
  }

  return buffer.toString('base64');
}

// Check if error is 429 quota exhausted
function isQuotaExhaustedError(error: any): boolean {
  const raw = typeof error === 'string' ? error : error?.message || JSON.stringify(error || '');
  return (
    error?.status === 429 ||
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('quota') ||
    raw.includes('rate-limit')
  );
}

// Clean error parser for Gemini SDK errors
function parseGeminiError(error: any): {
  isQuota: boolean;
  isAuth: boolean;
  code: string;
  cleanMessage: string;
} {
  const raw = typeof error === 'string' ? error : error?.message || JSON.stringify(error || '');
  const isQuota = isQuotaExhaustedError(error);

  const isAuth =
    error?.status === 403 ||
    error?.status === 400 ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('API_KEY_INVALID');

  let cleanMessage = 'Terjadi kesalahan pada layanan Gemini TTS.';
  let code = 'TTS_ERROR';

  if (isQuota) {
    cleanMessage =
      'Batas kuota harian Gemini API untuk model gemini-3.8-flash-tts telah terlampaui (429 Quota Exceeded).';
    code = 'QUOTA_EXHAUSTED';
  } else if (isAuth) {
    cleanMessage =
      'Kunci API Gemini tidak valid atau tidak memiliki izin akses (403/400). Periksa kunci pada panel Settings > Secrets.';
    code = 'AUTH_ERROR';
  }

  return { isQuota, isAuth, code, cleanMessage };
}

// Check status endpoint
app.get('/api/status', (req, res) => {
  const hasKey = keyPool.totalKeys > 0;
  res.json({
    status: 'ok',
    hasKey,
    totalKeys: keyPool.totalKeys,
    keyStatuses: keyPool.getStatusList(),
    model: TTS_MODEL,
    aiModel: AI_TEXT_MODEL,
    language: 'Arabic Fusha (العربية الفصحى)',
    styles: Object.keys(STYLE_CONFIGS),
  });
});

// Generate TTS audio with automatic multi-key failover
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, styleId, voiceName, customDirective } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص باللغة العربية الفصحى.' });
    }

    const validStyleId: TTSStyleId =
      styleId && STYLE_CONFIGS[styleId as TTSStyleId] ? (styleId as TTSStyleId) : 'netral';
    const chosenVoice = voiceName || 'Kore';
    const directive = buildSpeechDirective(validStyleId, customDirective);

    if (keyPool.totalKeys === 0) {
      const pitchOffset = validStyleId === 'gembira' ? 580 : validStyleId === 'formal_berita' ? 360 : 440;
      const fallbackBase64 = generateFallbackWav(pitchOffset, 3.5);
      return res.json({
        success: true,
        audioBase64: fallbackBase64,
        mimeType: 'audio/wav',
        styleId: validStyleId,
        voiceName: chosenVoice,
        text: text.trim(),
        directive,
        modelUsed: TTS_MODEL,
        isSimulated: true,
        notice: 'تم توليد صوت تجريبي للمعاينة لأن مفتاح GEMINI_API_KEY لم يتم ضبطه في لوحة Secrets.',
      });
    }

    try {
      const { result, keyIndex, totalKeys } = await keyPool.executeWithFailover(
        async (activeKey, index) => {
          const ai = new GoogleGenAI({
            apiKey: activeKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: text.trim(),
                    speechMetadata: {
                      style: directive,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: chosenVoice },
                },
              },
            },
          });

          const candidate = response.candidates?.[0];
          const audioPart = candidate?.content?.parts?.[0];
          const base64Audio = audioPart?.inlineData?.data;

          if (!base64Audio) {
            const textOutput = audioPart?.text || response.text;
            throw new Error(textOutput || 'Format respons tidak sesuai.');
          }

          return {
            base64Audio,
            mimeType: audioPart?.inlineData?.mimeType || 'audio/wav',
          };
        },
        isQuotaExhaustedError
      );

      return res.json({
        success: true,
        audioBase64: result.base64Audio,
        mimeType: result.mimeType,
        styleId: validStyleId,
        voiceName: chosenVoice,
        text: text.trim(),
        directive,
        modelUsed: TTS_MODEL,
        isSimulated: false,
        keyUsedIndex: keyIndex + 1,
        totalConfiguredKeys: totalKeys,
      });
    } catch (poolErr: any) {
      if (poolErr.message === 'ALL_KEYS_EXHAUSTED' || isQuotaExhaustedError(poolErr)) {
        // All configured keys have hit quota, fallback to simulated audio
        const pitchOffset = validStyleId === 'gembira' ? 580 : validStyleId === 'formal_berita' ? 360 : 440;
        const fallbackBase64 = generateFallbackWav(pitchOffset, 3.5);
        return res.json({
          success: true,
          audioBase64: fallbackBase64,
          mimeType: 'audio/wav',
          styleId: validStyleId,
          voiceName: chosenVoice,
          text: text.trim(),
          directive,
          modelUsed: TTS_MODEL,
          isSimulated: true,
          isQuotaExceeded: true,
          allKeysExhausted: true,
          totalKeysTried: keyPool.totalKeys,
          notice: `Semua ${keyPool.totalKeys} API Key yang terpasang telah melampaui kuota harian (429). Beralih ke audio pratinjau simulasi.`,
        });
      }
      throw poolErr;
    }
  } catch (error: any) {
    console.error('Error generating Gemini Arabic TTS:', error);
    const parsed = parseGeminiError(error);
    return res.status(500).json({
      error: parsed.cleanMessage,
      code: parsed.code,
      isQuota: parsed.isQuota,
    });
  }
});

// Compare all 3 styles in Arabic Fusha with failover
app.post('/api/tts/compare-all', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص باللغة العربية الفصحى.' });
    }

    const chosenVoice = voiceName || 'Kore';
    const styles: TTSStyleId[] = ['netral', 'gembira', 'formal_berita'];

    if (keyPool.totalKeys === 0) {
      const results = styles.map((styleId) => {
        const pitchOffset = styleId === 'gembira' ? 580 : styleId === 'formal_berita' ? 360 : 440;
        return {
          styleId,
          audioBase64: generateFallbackWav(pitchOffset, 3.0),
          mimeType: 'audio/wav',
          directive: buildSpeechDirective(styleId),
          modelUsed: TTS_MODEL,
          isSimulated: true,
        };
      });

      return res.json({
        success: true,
        text: text.trim(),
        voiceName: chosenVoice,
        modelUsed: TTS_MODEL,
        results,
        isSimulated: true,
        notice: 'تم استخدام أصوات معاينة تجريبية لعدم توفر GEMINI_API_KEY.',
      });
    }

    let anyQuotaExceeded = false;

    const promises = styles.map(async (styleId) => {
      const directive = buildSpeechDirective(styleId);
      try {
        const { result } = await keyPool.executeWithFailover(
          async (activeKey) => {
            const ai = new GoogleGenAI({
              apiKey: activeKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            const response = await ai.models.generateContent({
              model: TTS_MODEL,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: text.trim(),
                      speechMetadata: {
                        style: directive,
                      },
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: chosenVoice },
                  },
                },
              },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) throw new Error('Format respons tidak sesuai');
            return base64Audio;
          },
          isQuotaExhaustedError
        );

        return {
          styleId,
          audioBase64: result,
          mimeType: 'audio/wav',
          directive,
          modelUsed: TTS_MODEL,
          success: true,
        };
      } catch (err: any) {
        if (err.message === 'ALL_KEYS_EXHAUSTED' || isQuotaExhaustedError(err)) {
          anyQuotaExceeded = true;
          const pitchOffset = styleId === 'gembira' ? 580 : styleId === 'formal_berita' ? 360 : 440;
          return {
            styleId,
            audioBase64: generateFallbackWav(pitchOffset, 3.0),
            mimeType: 'audio/wav',
            directive,
            modelUsed: TTS_MODEL,
            success: true,
            isSimulated: true,
            isQuotaExceeded: true,
          };
        }

        const parsed = parseGeminiError(err);
        return {
          styleId,
          error: parsed.cleanMessage,
          success: false,
          isQuota: parsed.isQuota,
        };
      }
    });

    const results = await Promise.all(promises);
    return res.json({
      success: true,
      text: text.trim(),
      voiceName: chosenVoice,
      modelUsed: TTS_MODEL,
      results,
      isQuotaExceeded: anyQuotaExceeded,
      totalKeysConfigured: keyPool.totalKeys,
      keyStatuses: keyPool.getStatusList(),
    });
  } catch (error: any) {
    console.error('Error comparing Arabic styles:', error);
    const parsed = parseGeminiError(error);
    return res.status(500).json({
      error: parsed.cleanMessage,
      isQuota: parsed.isQuota,
    });
  }
});

// AI Feature 1: Tashkeel / Harakat Adder with failover
app.post('/api/ai/tashkeel', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص باللغة العربية لتشكيله.' });
    }

    if (keyPool.totalKeys === 0) {
      return res.json({
        success: true,
        textWithTashkeel: text.trim(),
        notice: 'يتطلب التشكيل الذكي بالذكاء الاصطناعي ضبط مفتاح GEMINI_API_KEY.',
      });
    }

    try {
      const { result } = await keyPool.executeWithFailover(
        async (activeKey) => {
          const ai = new GoogleGenAI({
            apiKey: activeKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const response = await ai.models.generateContent({
            model: AI_TEXT_MODEL,
            contents: `أنت عالم لغوي وخبير في النحو والصرف العربي. قم بضبط وتشكيل النص العربي التالي تشكيلًا إعرابيًا كاملًا ودقيقًا بالحركات (الفتحة، الضمة، الكسرة، السكون، التنوين، الشدة) ليكون معدًا للنطق الصوتي الفصيح التام. لا تضف أي نص أو مقدمات أو شرح؛ أعد فقط النص مشكولًا:
${text.trim()}`,
            config: {
              systemInstruction:
                'أعد النص العربي مشكولاً بالحركات الإعرابية التامة فقط دون أي زيادات أو مقدمات أو خاتمة.',
            },
          });

          return response.text?.trim() || text.trim();
        },
        isQuotaExhaustedError
      );

      return res.json({
        success: true,
        textWithTashkeel: result,
      });
    } catch (err: any) {
      const parsed = parseGeminiError(err);
      return res.json({
        success: false,
        error: parsed.cleanMessage,
        isQuota: parsed.isQuota,
        textWithTashkeel: text.trim(),
      });
    }
  } catch (error: any) {
    console.error('Error in AI Tashkeel:', error);
    return res.status(500).json({
      error: 'فشل التشكيل التلقائي للنص.',
    });
  }
});

// AI Feature 2: Generate Arabic Fusha Script based on topic/style with failover
app.post('/api/ai/generate-script', async (req, res) => {
  try {
    const { prompt, styleId } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال فكرة أو موضوع النص.' });
    }

    const validStyleId: TTSStyleId =
      styleId && STYLE_CONFIGS[styleId as TTSStyleId] ? (styleId as TTSStyleId) : 'netral';
    const styleInfo = STYLE_CONFIGS[validStyleId];

    if (keyPool.totalKeys === 0) {
      return res.json({
        success: true,
        generatedScript: styleInfo.sampleText,
        notice: 'يتطلب توليد النصوص بالذكاء الاصطناعي مفتاح GEMINI_API_KEY.',
      });
    }

    const promptInstruction = `أنت كاتب ومعد نصوص محترف باللغة العربية الفصحى. اكتب نصًا صوتيًا فصيحًا ومؤثرًا (بين 25 إلى 60 كلمة) ومشكولًا بالحركات الإعرابية التامة بدقة، ليكون مخصصًا للإلقاء الصوتي عبر تحويل النص إلى صوت (TTS).
الموضوع أو الفكرة المطلوبة: "${prompt.trim()}".
نمط الإلقاء المستهدف: ${styleInfo.nameArabic} (${styleInfo.directive}).
ملاحظة هامة: يجب أن يكون النص باللغة العربية الفصحى الراقية، مضبوطًا بالحركات، وبدون أي عبارات تقديمية مثل "إليك النص" أو علامات اقتباس. أعد النص المباشر فقط.`;

    try {
      const { result } = await keyPool.executeWithFailover(
        async (activeKey) => {
          const ai = new GoogleGenAI({
            apiKey: activeKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const response = await ai.models.generateContent({
            model: AI_TEXT_MODEL,
            contents: promptInstruction,
          });

          return response.text?.trim() || styleInfo.sampleText;
        },
        isQuotaExhaustedError
      );

      return res.json({
        success: true,
        generatedScript: result,
        styleId: validStyleId,
      });
    } catch (err: any) {
      const parsed = parseGeminiError(err);
      return res.json({
        success: true,
        generatedScript: styleInfo.sampleText,
        isQuota: parsed.isQuota,
        notice: parsed.cleanMessage,
      });
    }
  } catch (error: any) {
    console.error('Error in AI script generator:', error);
    return res.status(500).json({
      error: 'فشل توليد النص بالذكاء الاصطناعي.',
    });
  }
});

// AI Feature 3: Enhance / Translate / Convert to Arabic Fusha with failover
app.post('/api/ai/enhance-fusha', async (req, res) => {
  try {
    const { text, targetStyle } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص لتحسينه إلى الفصحى.' });
    }

    const validStyle: TTSStyleId =
      targetStyle && STYLE_CONFIGS[targetStyle as TTSStyleId] ? (targetStyle as TTSStyleId) : 'netral';
    const styleInfo = STYLE_CONFIGS[validStyle];

    if (keyPool.totalKeys === 0) {
      return res.json({
        success: true,
        enhancedScript: text.trim(),
        notice: 'يتطلب تحسين النص مفتاح GEMINI_API_KEY.',
      });
    }

    const promptInstruction = `قم بتحويل وإعادة صياغة وترجمة النص التالي (سواء كان بالعربية العامية، الإندونيسية، الإنجليزية، أو صياغة عربية بسيطة) إلى نص باللغة العربية الفصحى البليغة والمضبوطة ضبطًا إعرابيًا كاملًا بالحركات (تشكيل تام)، ليتناسب مع الإلقاء الصوتي بنمط (${styleInfo.nameArabic}).
النص الأصلي:
"${text.trim()}"
أعد فقط النص العربي الفصيح المشكول مباشرة دون أي شروحات أو مقدمات.`;

    try {
      const { result } = await keyPool.executeWithFailover(
        async (activeKey) => {
          const ai = new GoogleGenAI({
            apiKey: activeKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const response = await ai.models.generateContent({
            model: AI_TEXT_MODEL,
            contents: promptInstruction,
          });

          return response.text?.trim() || text.trim();
        },
        isQuotaExhaustedError
      );

      return res.json({
        success: true,
        enhancedScript: result,
      });
    } catch (err: any) {
      const parsed = parseGeminiError(err);
      return res.json({
        success: true,
        enhancedScript: text.trim(),
        isQuota: parsed.isQuota,
        notice: parsed.cleanMessage,
      });
    }
  } catch (error: any) {
    console.error('Error in AI enhance to Fusha:', error);
    return res.status(500).json({
      error: 'فشل تحسين النص إلى الفصحى.',
    });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini Arabic Fusha TTS Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
