import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS, LANGUAGE_OPTIONS, getTranslation, AppLanguage } from './i18n';

test('LANGUAGE_OPTIONS contains en, ar, and id', () => {
  const ids = LANGUAGE_OPTIONS.map((l) => l.id);
  assert.ok(ids.includes('en'), 'Should have en');
  assert.ok(ids.includes('ar'), 'Should have ar');
  assert.ok(ids.includes('id'), 'Should have id');
  assert.equal(LANGUAGE_OPTIONS.length, 3);
});

test('All languages have identical key sets in translation schema', () => {
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const arKeys = Object.keys(TRANSLATIONS.ar).sort();
  const idKeys = Object.keys(TRANSLATIONS.id).sort();

  assert.deepEqual(enKeys, arKeys, 'Arabic keys must match English keys');
  assert.deepEqual(enKeys, idKeys, 'Indonesian keys must match English keys');
});

test('getTranslation returns valid translations and falls back safely', () => {
  const en = getTranslation('en');
  assert.equal(en.appTitle, 'Gemini Arabic TTS Studio');

  const ar = getTranslation('ar');
  assert.ok(ar.appTitle.includes('جيميناي'));

  const id = getTranslation('id');
  assert.ok(id.stylesTitle.includes('Gaya'));

  // Fallback test
  const fallback = getTranslation('non_existent' as AppLanguage);
  assert.equal(fallback.appTitle, 'Gemini Arabic TTS Studio');
});
