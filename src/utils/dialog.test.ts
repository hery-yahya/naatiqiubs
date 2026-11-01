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

test('cursor helpers find the right turn, including continuation lines', async () => {
  const { lineIndexAt, lineStartOffset, getLineInfo } = await import('./dialog');
  const script = 'أحمد: السلام عليكم\nفاطمة (بفرح): وعليكم السلام\nكيف حالك؟\n\nأحمد: بخير';
  assert.equal(lineIndexAt(script, 0), 0);
  assert.equal(lineIndexAt(script, script.indexOf('كيف')), 2);
  assert.equal(lineStartOffset(script, 2), script.indexOf('كيف'));
  assert.deepEqual(getLineInfo(script, 2), { ownerLine: 1, name: 'فاطمة', expression: 'بفرح', text: 'وعليكم السلام' });
  assert.equal(getLineInfo(script, 3)?.ownerLine, 1); // blank line belongs to the turn above
  assert.equal(getLineInfo('tanpa nama', 0), null);
});

test('setLineExpression adds, replaces and removes expressions', async () => {
  const { setLineExpression, parseDialog } = await import('./dialog');
  const script = 'أحمد: السلام عليكم\nفاطمة (بفرح): وعليكم السلام\nكيف حالك؟';
  const added = setLineExpression(script, 0, 'بتعجب')!;
  assert.equal(added.script.split('\n')[0], 'أحمد (بتعجب): السلام عليكم');
  const replaced = setLineExpression(script, 2, 'بحزن')!; // continuation line -> Fatimah's turn
  assert.equal(replaced.ownerLine, 1);
  assert.equal(replaced.script.split('\n')[1], 'فاطمة (بحزن): وعليكم السلام');
  const removed = setLineExpression(script, 1, '')!;
  assert.equal(removed.script.split('\n')[1], 'فاطمة: وعليكم السلام');
  const sanitized = setLineExpression(script, 0, 'senang (sekali): ya')!;
  assert.equal(sanitized.script.split('\n')[0], 'أحمد (senang sekali ya): السلام عليكم');
  assert.deepEqual(parseDialog(sanitized.script).errors, []);
  assert.deepEqual(parseDialog(script).sourceLines, [0, 1]);
});
