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
  const voiceNames = AVAILABLE_VOICES.map((v) => v.name);
  assert.ok(voiceNames.includes('Kore'));
  assert.ok(voiceNames.includes('Fenrir'));
  assert.ok(voiceNames.includes('Puck'));
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

test('buildSpeechDirective merges Arabic base directive and custom prompt', () => {
  const baseNetral = buildSpeechDirective('netral');
  assert.ok(baseNetral.includes('العربية الفصحى'));

  const withCustom = buildSpeechDirective('gembira', 'بنبرة فرح طفولي');
  assert.ok(withCustom.includes('مبهجة'));
  assert.ok(withCustom.includes('بنبرة فرح طفولي'));
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
