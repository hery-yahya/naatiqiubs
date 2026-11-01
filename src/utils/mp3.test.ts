import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildId3, parseWav, wavToMp3 } from './mp3';

function makeWav(seconds: number, sampleRate = 24000): Uint8Array {
  const n = Math.floor(seconds * sampleRate);
  const buf = new Uint8Array(44 + n * 2);
  const v = new DataView(buf.buffer);
  const w = (o: number, s: string) => [...s].forEach((c, i) => (buf[o + i] = c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / sampleRate)), true);
  return buf;
}

test('parseWav reads format and samples, even with a broken data size', () => {
  const wav = makeWav(0.5);
  const p = parseWav(wav);
  assert.equal(p.sampleRate, 24000);
  assert.equal(p.channels, 1);
  assert.equal(p.samples.length, 12000);
  new DataView(wav.buffer).setUint32(40, 0xffffffff, true);
  assert.equal(parseWav(wav).samples.length, 12000);
  assert.throws(() => parseWav(new Uint8Array(20)));
});

test('buildId3 writes a valid ID3v2.3 header with UTF-16 frames', () => {
  const tag = buildId3({ title: 'مرحبا', artist: 'Nāṭiq' });
  assert.equal(String.fromCharCode(tag[0], tag[1], tag[2]), 'ID3');
  assert.equal(tag[3], 3);
  const size = (tag[6] << 21) | (tag[7] << 14) | (tag[8] << 7) | tag[9];
  assert.equal(size, tag.length - 10);
  assert.equal(String.fromCharCode(...tag.slice(10, 14)), 'TIT2');
});

test('wavToMp3 produces MP3 frames that are much smaller than the WAV', async () => {
  vm.runInThisContext(readFileSync(new URL('../../public/vendor/lame.min.js', import.meta.url), 'utf8'));
  (globalThis as any).window = globalThis;
  const wav = makeWav(3);
  const mp3 = await wavToMp3(wav);
  assert.ok(mp3.length > 1000);
  assert.ok(mp3.length < wav.length / 4);
  assert.equal(mp3[0], 0xff); // MP3 frame sync
  assert.equal(mp3[1] & 0xe0, 0xe0);
});
