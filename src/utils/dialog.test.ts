import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDialog, formatDialog, DIALOG_SAMPLES, normalizeName } from './dialog';

test('parses two speakers, expressions and continuation lines', () => {
  const r = parseDialog(
    [
      'أحمد: السلام عليكم',
      '',
      'فاطمة (بفرح): وعليكم السلام',
      'كيف حالك؟',
      'أَحْمَدُ [متعجبًا]: بخير',
    ].join('\n')
  );
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.names, ['أحمد', 'فاطمة']);
  assert.equal(r.lines.length, 3);
  assert.deepEqual(r.lines[1], { speaker: 1, text: 'وعليكم السلام كيف حالك؟', expression: 'بفرح' });
  // "أَحْمَدُ" with harakat is the same speaker as "أحمد"
  assert.equal(r.lines[2].speaker, 0);
  assert.equal(r.lines[2].expression, 'متعجبًا');
});

test('reports errors clearly', () => {
  assert.equal(parseDialog('').errors[0].code, 'EMPTY');
  assert.equal(parseDialog('tanpa nama').errors[0].code, 'NO_NAME_FIRST_LINE');
  assert.equal(parseDialog('A: satu\nA: dua').errors[0].code, 'ONE_SPEAKER');
  const three = parseDialog('A: satu\nB: dua\nC: tiga');
  assert.equal(three.errors[0].code, 'TOO_MANY_SPEAKERS');
  assert.equal(three.errors[0].detail, 'C');
  assert.equal(three.errors[0].line, 3);
  assert.equal(parseDialog('A: ' + 'x'.repeat(3001) + '\nB: y').errors.some((e) => e.code === 'TOO_LONG'), true);
});

test('latin names, full-width colon, and round-trip formatting', () => {
  const r = parseDialog('Ustadz: Ahlan\nAhmad (senang)： Ahlan wa sahlan');
  assert.deepEqual(r.names, ['Ustadz', 'Ahmad']);
  assert.equal(formatDialog(r.names, r.lines), 'Ustadz: Ahlan\nAhmad (senang): Ahlan wa sahlan');
  assert.equal(normalizeName('  Ahmad  '), 'ahmad');
});

test('built-in samples parse without errors', () => {
  for (const s of DIALOG_SAMPLES) {
    const r = parseDialog(s.script);
    assert.deepEqual(r.errors, [], s.id);
    assert.equal(r.names.length, 2, s.id);
  }
});
