/**
 * Ubah audio WAV menjadi MP3 langsung di browser (tanpa server, tanpa kuota Gemini).
 *
 * Memakai lamejs (port JavaScript dari LAME, lisensi LGPL) yang disimpan terpisah di
 * /vendor/lame.min.js dan baru dimuat saat pengguna pertama kali mengunduh MP3.
 */

/** Bitrate MP3 untuk suara (mono). 64 kbps jernih untuk ucapan dan ± 6x lebih kecil dari WAV. */
export const MP3_BITRATE_KBPS = 64;

const LAME_URL = '/vendor/lame.min.js';

interface LameEncoder {
  encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
  flush(): Int8Array;
}
interface LameJs {
  Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => LameEncoder;
}

let lamePromise: Promise<LameJs> | null = null;

/** Muat encoder MP3 sekali saja. */
export function loadLame(): Promise<LameJs> {
  const w = window as unknown as { lamejs?: LameJs };
  if (w.lamejs?.Mp3Encoder) return Promise.resolve(w.lamejs);
  if (lamePromise) return lamePromise;
  lamePromise = new Promise<LameJs>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = LAME_URL;
    script.async = true;
    script.onload = () => {
      if (w.lamejs?.Mp3Encoder) resolve(w.lamejs);
      else reject(new Error('Encoder MP3 tidak termuat dengan benar.'));
    };
    script.onerror = () => reject(new Error('Encoder MP3 tidak bisa dimuat. Periksa koneksi internet.'));
    document.head.appendChild(script);
  });
  lamePromise.catch(() => {
    lamePromise = null;
  });
  return lamePromise;
}

export interface PcmAudio {
  sampleRate: number;
  channels: number;
  /** sampel 16-bit; kalau stereo, kiri & kanan bergantian */
  samples: Int16Array;
}

function ascii(bytes: Uint8Array, offset: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[offset + i]);
  return s;
}

/** Baca isi file WAV (PCM 16-bit). */
export function parseWav(wav: Uint8Array): PcmAudio {
  if (wav.length < 12 || ascii(wav, 0, 4) !== 'RIFF' || ascii(wav, 8, 4) !== 'WAVE') {
    throw new Error('Format audio bukan WAV.');
  }
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  let pos = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bits = 16;
  while (pos + 8 <= wav.length) {
    const id = ascii(wav, pos, 4);
    const size = view.getUint32(pos + 4, true);
    const body = pos + 8;
    if (id === 'fmt ') {
      const format = view.getUint16(body, true);
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bits = view.getUint16(body + 14, true);
      if (format !== 1 && format !== 0xfffe) throw new Error('Audio WAV tidak berformat PCM.');
    } else if (id === 'data') {
      if (bits !== 16) throw new Error(`Audio ${bits}-bit belum didukung untuk MP3.`);
      // Ukuran "data" kadang tidak diisi dengan benar; batasi sampai akhir file.
      const end = Math.min(wav.length, size > 0 && size !== 0xffffffff ? body + size : wav.length);
      const byteLen = (end - body) & ~1;
      const copy = new Uint8Array(byteLen);
      copy.set(wav.subarray(body, body + byteLen));
      return { sampleRate, channels, samples: new Int16Array(copy.buffer) };
    }
    pos = body + size + (size % 2);
  }
  throw new Error('Data audio tidak ditemukan di file WAV.');
}

const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0));

/** Ubah WAV menjadi MP3. */
export async function wavToMp3(wav: Uint8Array, kbps = MP3_BITRATE_KBPS): Promise<Uint8Array> {
  const lame = await loadLame();
  const { sampleRate, channels, samples } = parseWav(wav);
  const encoder = new lame.Mp3Encoder(channels === 2 ? 2 : 1, sampleRate, kbps);
  const parts: Int8Array[] = [];
  const frame = 1152;

  if (channels === 2) {
    const frames = Math.floor(samples.length / 2);
    const left = new Int16Array(frames);
    const right = new Int16Array(frames);
    for (let i = 0; i < frames; i++) {
      left[i] = samples[2 * i];
      right[i] = samples[2 * i + 1];
    }
    for (let i = 0, n = 0; i < frames; i += frame, n++) {
      const out = encoder.encodeBuffer(left.subarray(i, i + frame), right.subarray(i, i + frame));
      if (out.length) parts.push(out);
      if (n % 200 === 199) await yieldToBrowser();
    }
  } else {
    for (let i = 0, n = 0; i < samples.length; i += frame, n++) {
      const out = encoder.encodeBuffer(samples.subarray(i, i + frame));
      if (out.length) parts.push(out);
      if (n % 200 === 199) await yieldToBrowser();
    }
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(tail);

  const total = parts.reduce((n, p) => n + p.length, 0);
  const mp3 = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    mp3.set(new Uint8Array(p.buffer, p.byteOffset, p.length), o);
    o += p.length;
  }
  return mp3;
}

/* ------------------------------------------------------------------ */
/* Label ID3 (judul, artis, keterangan) agar terbaca di HP & pemutar     */
/* ------------------------------------------------------------------ */

export interface Id3Tags {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  comment?: string;
}

/** Teks UTF-16 dengan BOM (didukung luas, termasuk huruf Arab). */
function utf16WithBom(text: string): number[] {
  const out = [0xff, 0xfe];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out.push(c & 0xff, c >> 8);
  }
  return out;
}

function frame(id: string, body: number[]): number[] {
  const size = body.length;
  return [
    ...Array.from(id).map((c) => c.charCodeAt(0)),
    (size >>> 24) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 8) & 0xff,
    size & 0xff,
    0,
    0,
    ...body,
  ];
}

function textFrame(id: string, text: string): number[] {
  return frame(id, [1, ...utf16WithBom(text)]);
}

/** Buat label ID3v2.3. */
export function buildId3(tags: Id3Tags): Uint8Array {
  const frames: number[] = [];
  if (tags.title) frames.push(...textFrame('TIT2', tags.title));
  if (tags.artist) frames.push(...textFrame('TPE1', tags.artist));
  if (tags.album) frames.push(...textFrame('TALB', tags.album));
  if (tags.year) frames.push(...textFrame('TYER', tags.year));
  if (tags.genre) frames.push(...textFrame('TCON', tags.genre));
  if (tags.comment) {
    // COMM: encoding, bahasa (3 huruf), deskripsi pendek (kosong) diakhiri 00 00, lalu isi
    frames.push(...frame('COMM', [1, 0x69, 0x6e, 0x64, 0xff, 0xfe, 0, 0, ...utf16WithBom(tags.comment)]));
  }
  const size = frames.length;
  const header = [
    0x49,
    0x44,
    0x33, // "ID3"
    3,
    0, // versi 2.3.0
    0, // flags
    (size >>> 21) & 0x7f,
    (size >>> 14) & 0x7f,
    (size >>> 7) & 0x7f,
    size & 0x7f,
  ];
  return new Uint8Array([...header, ...frames]);
}

/** Gabungkan label ID3 di depan data MP3. */
export function withId3(mp3: Uint8Array, tags: Id3Tags): Uint8Array {
  const tag = buildId3(tags);
  const out = new Uint8Array(tag.length + mp3.length);
  out.set(tag, 0);
  out.set(mp3, tag.length);
  return out;
}
