import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STYLE_CONFIGS,
  validateTtsInput,
  buildSpeechDirective,
  estimateSpeechDurationSeconds,
  formatTime,
  AVAILABLE_VOICES,
  TTS_MODEL,
  isArabicText,
  applyTempoToText,
  isTempoId,
} from './tts-helper';

test('STYLE_CONFIGS contains all 3 Arabic Fusha styles', () => {
  assert.ok(STYLE_CONFIGS.netral, 'Must have netral style');
  assert.ok(STYLE_CONFIGS.gembira, 'Must have gembira style');
  assert.ok(STYLE_CONFIGS.formal_berita, 'Must have formal_berita style');

  assert.equal(STYLE_CONFIGS.netral.id, 'netral');
  assert.equal(STYLE_CONFIGS.gembira.id, 'gembira');
  assert.equal(STYLE_CONFIGS.formal_berita.id, 'formal_berita');

  // Verify Arabic text in samples
  assert.ok(isArabicText(STYLE_CONFIGS.netral.sampleText));
  assert.ok(isArabicText(STYLE_CONFIGS.gembira.sampleText));
  assert.ok(isArabicText(STYLE_CONFIGS.formal_berita.sampleText));
});

test('TTS_MODEL is set to gemini-3.8-flash-tts', () => {
  assert.equal(TTS_MODEL, 'gemini-3.8-flash-tts');
});

test('AVAILABLE_VOICES has Arabic voice options', () => {
  assert.ok(AVAILABLE_VOICES.length >= 3);
  const voiceIds = AVAILABLE_VOICES.map((v) => v.id);
  assert.ok(voiceIds.includes('Kore') && voiceIds.includes('Fenrir') && voiceIds.includes('Puck'));
  const names = AVAILABLE_VOICES.map((v) => v.name).sort();
  assert.deepEqual(names, ['Maryam', 'Musa', 'Yasir', 'Zaid', 'Zainab']);
});

test('validateTtsInput checks empty and Arabic string bounds', () => {
  const emptyRes = validateTtsInput('   ');
  assert.equal(emptyRes.isValid, false);

  const arabicText = 'مَرْحَبًا بِكُمْ جَمِيعًا فِي اسْتُودْيُو جِيمِينَاي';
  const validRes = validateTtsInput(arabicText);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.wordCount, 6);

  const overflowText = 'أ'.repeat(2005);
  const overflowRes = validateTtsInput(overflowText, 2000);
  assert.equal(overflowRes.isValid, false);
});

test('buildSpeechDirective builds a short style, with expression replacing the base style', () => {
  assert.equal(buildSpeechDirective('netral'), 'calm, clear and natural');
  assert.equal(
    buildSpeechDirective('gembira', 'بنبرة فرح طفولي'),
    'cheerful and enthusiastic, smiling; بنبرة فرح طفولي'
  );
  assert.equal(
    buildSpeechDirective('gembira', undefined, 'lambat', 'whispering softly'),
    'whispering softly; speaking slowly and clearly'
  );
  assert.ok(buildSpeechDirective('formal_berita').length < 80);
});

test('isArabicText correctly detects Arabic characters', () => {
  assert.equal(isArabicText('مرحبا بكم'), true);
  assert.equal(isArabicText('Hello world'), false);
  assert.equal(isArabicText('Halo selamat pagi'), false);
});

test('estimateSpeechDurationSeconds and formatTime work accurately', () => {
  const words115 = Array(115).fill('كَلِمَة').join(' ');
  const dur = estimateSpeechDurationSeconds(words115, 1);
  assert.equal(dur, 60);

  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(125), '02:05');
});

test('applyTempoToText inserts pauses only for the word-by-word tempo', () => {
  const text = 'ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ. ثُمَّ رَجَعَ';
  assert.equal(applyTempoToText(text, 'normal'), text);
  assert.equal(applyTempoToText(text, 'lambat'), text);
  assert.equal(
    applyTempoToText(text, 'eja'),
    'ذَهَبَ <short pause> الطَّالِبُ <short pause> إِلَى <short pause> الْمَدْرَسَةِ. <long pause> ثُمَّ <short pause> رَجَعَ'
  );
  assert.equal(applyTempoToText('كَلِمَةٌ', 'eja'), 'كَلِمَةٌ');
});

test('buildSpeechDirective adds tempo instructions', () => {
  assert.ok(!buildSpeechDirective('netral').includes('speaking slowly'));
  assert.ok(buildSpeechDirective('netral', undefined, 'lambat').includes('speaking slowly'));
  assert.ok(buildSpeechDirective('gembira', 'بصوت هادئ', 'eja').includes('word by word'));
  assert.ok(isTempoId('eja') && !isTempoId('cepat'));
});

test('audio file names carry voice, style, tempo, expression and time', async () => {
  const { buildFileName, textSnippet } = await import('./audio-meta');
  const ts = new Date(2026, 10, 1, 6, 36).getTime();
  const name = buildFileName({
    text: 'أَهْلًا وَسَهْلًا بِكُمْ فِي تَطْبِيقِ نَاطِقٍ',
    styleId: 'gembira',
    voiceName: 'Kore',
    tempo: 'eja',
    customDirective: 'بصوت معلم',
    timestamp: ts,
  });
  assert.equal(name, 'Naatiq_2026-11-01-0636_Maryam-Wanita_Gembira_Lambat-Jeda_ekspresi-بصوت-معلم_أهلا-وسهلا-بكم-في.wav');
  assert.equal(
    buildFileName({ text: 'مرحبا', styleId: 'netral', voiceName: 'Fenrir', timestamp: ts }),
    'Naatiq_2026-11-01-0636_Zaid-Pria_Netral_Normal_مرحبا.wav'
  );
  assert.equal(textSnippet('أَهْلًا، وَسَهْلًا!'), 'أهلا وسهلا');
});

test('Koleksi title matches the download name, separated by spaces', async () => {
  const { buildKoleksiTitle, buildFileName } = await import('./audio-meta');
  const meta = {
    text: 'مَرْحَبًا بِكُمْ فِي دَرْسِ الْيَوْمِ',
    styleId: 'formal_berita' as const,
    voiceName: 'Fenrir',
    tempo: 'normal' as const,
    timestamp: new Date(2026, 10, 1, 14, 41).getTime(),
  };
  assert.equal(buildKoleksiTitle(meta), 'Naatiq 2026-11-01-1441 Zaid-Pria Formal-Berita Normal مرحبا بكم في درس');
  assert.equal(buildFileName(meta, 'mp3'), 'Naatiq_2026-11-01-1441_Zaid-Pria_Formal-Berita_Normal_مرحبا-بكم-في-درس.mp3');
  const dialog = { ...meta, speakers: [{ name: 'أحمد', voiceName: 'Puck' }, { name: 'عمر', voiceName: 'Charon' }] };
  assert.ok(buildKoleksiTitle(dialog).includes('Dialog-Musa-Yasir'));
});
