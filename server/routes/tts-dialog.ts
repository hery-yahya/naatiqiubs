import {
  DialogTurn,
  errorResponse,
  GeminiError,
  json,
  PagesContext,
  readJson,
  requireApiKey,
  synthesizeDialog,
  TTS_MODEL,
} from '../gemini';
import {
  applyTempoToText,
  AVAILABLE_VOICES,
  buildSpeechDirective,
  isTempoId,
  STYLE_CONFIGS,
  TempoId,
  TTSStyleId,
} from '../../src/utils/tts-helper';
import {
  formatDialog,
  MAX_DIALOG_CHARS,
  MAX_DIALOG_LINES,
  MAX_EXPRESSION_CHARS,
  MAX_NAME_CHARS,
} from '../../src/utils/dialog';

const SPEAKER_IDS = ['Speaker1', 'Speaker2'];

function bad(message: string): never {
  throw new GeminiError('BAD_REQUEST', message, 400);
}

// POST /api/tts/dialog — dialog dua tokoh menjadi satu audio.
// Isi permintaan: { speakers: [{name, voiceName}, {name, voiceName}], lines: [{speaker: 0|1, text, expression?}],
//                   styleId?, tempo?, customDirective? }
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    const body = await readJson(request);

    // Tokoh
    const rawSpeakers = Array.isArray(body.speakers) ? body.speakers : [];
    if (rawSpeakers.length !== 2) bad('Dialog harus berisi tepat 2 tokoh.');
    const speakers = rawSpeakers.map((s: any, i: number) => {
      const name = typeof s?.name === 'string' ? s.name.trim().slice(0, MAX_NAME_CHARS) : '';
      const voiceName = AVAILABLE_VOICES.some((v) => v.id === s?.voiceName) ? s.voiceName : null;
      if (!name) bad(`Nama tokoh ${i + 1} kosong.`);
      if (!voiceName) bad(`Suara untuk tokoh "${name}" tidak dikenal.`);
      return { name, voiceName: voiceName as string };
    });

    // Baris dialog
    const rawLines = Array.isArray(body.lines) ? body.lines : [];
    if (rawLines.length === 0) bad('Naskah dialog masih kosong.');
    if (rawLines.length > MAX_DIALOG_LINES) bad(`Dialog terlalu panjang (maksimal ${MAX_DIALOG_LINES} baris).`);
    const lines = rawLines.map((l: any, i: number) => {
      const speaker = l?.speaker === 0 || l?.speaker === 1 ? l.speaker : bad(`Tokoh pada baris ${i + 1} tidak dikenal.`);
      const text = typeof l?.text === 'string' ? l.text.trim() : '';
      if (!text) bad(`Baris ${i + 1} kosong.`);
      const expression =
        typeof l?.expression === 'string' && l.expression.trim()
          ? l.expression.trim().slice(0, MAX_EXPRESSION_CHARS)
          : undefined;
      return { speaker: speaker as number, text, expression };
    });
    const totalChars = lines.reduce((n: number, l: { text: string }) => n + l.text.length, 0);
    if (totalChars > MAX_DIALOG_CHARS) {
      bad(`Dialog terlalu panjang (${totalChars} karakter). Maksimal ${MAX_DIALOG_CHARS} karakter.`);
    }

    const styleId: TTSStyleId = STYLE_CONFIGS[body.styleId as TTSStyleId] ? body.styleId : 'netral';
    const tempo: TempoId = isTempoId(body.tempo) ? body.tempo : 'normal';
    const customDirective =
      typeof body.customDirective === 'string' ? body.customDirective.slice(0, 500) : undefined;
    const baseStyle = buildSpeechDirective(styleId, customDirective, tempo);

    const turns: DialogTurn[] = lines.map((l: { speaker: number; text: string; expression?: string }) => ({
      speakerId: SPEAKER_IDS[l.speaker],
      text: applyTempoToText(l.text, tempo),
      style: l.expression ? `${baseStyle} التعبير في هذا السطر: ${l.expression}.` : baseStyle,
    }));

    const apiKey = requireApiKey(env);
    const { audioBase64, mimeType } = await synthesizeDialog(
      apiKey,
      turns,
      speakers.map((s: { voiceName: string }, i: number) => ({ speakerId: SPEAKER_IDS[i], voiceName: s.voiceName }))
    );

    return json({
      success: true,
      audioBase64,
      mimeType,
      mode: 'dialog',
      styleId,
      tempo,
      speakers,
      text: formatDialog(
        speakers.map((s: { name: string }) => s.name),
        lines
      ),
      modelUsed: TTS_MODEL,
    });
  } catch (err) {
    return errorResponse(err);
  }
};
