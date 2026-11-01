/**
 * Pembaca naskah dialog.
 *
 * Format per baris:   Nama: teks
 * Dengan ekspresi:    Nama (ekspresi): teks      atau   Nama [ekspresi]: teks
 * Baris tanpa "Nama:" dianggap lanjutan baris sebelumnya.
 *
 * Gemini mendukung maksimal 2 pembicara dalam satu audio.
 */

export const MAX_DIALOG_SPEAKERS = 2;
export const MAX_DIALOG_LINES = 60;
export const MAX_DIALOG_CHARS = 3000;
export const MAX_NAME_CHARS = 30;
export const MAX_EXPRESSION_CHARS = 100;

export interface DialogLine {
  /** 0 = tokoh pertama, 1 = tokoh kedua */
  speaker: number;
  text: string;
  expression?: string;
}

export interface DialogSpeaker {
  name: string;
  voiceName: string;
}

export type DialogErrorCode =
  | 'EMPTY'
  | 'NO_NAME_FIRST_LINE'
  | 'TOO_MANY_SPEAKERS'
  | 'ONE_SPEAKER'
  | 'TOO_MANY_LINES'
  | 'TOO_LONG'
  | 'NAME_TOO_LONG';

export interface DialogError {
  code: DialogErrorCode;
  /** nomor baris (mulai 1) bila relevan */
  line?: number;
  /** keterangan tambahan, misalnya nama tokoh ketiga */
  detail?: string;
}

export interface ParsedDialog {
  names: string[];
  lines: DialogLine[];
  /** sourceLines[i] = nomor baris naskah (mulai 0) tempat giliran ke-i ditulis */
  sourceLines: number[];
  errors: DialogError[];
  totalChars: number;
}

/** Samakan nama untuk dibandingkan (tanpa harakat, spasi rapat, huruf kecil). */
export function normalizeName(name: string): string {
  return name
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Nama (maks. 30 karakter, tanpa titik dua) + ekspresi opsional dalam () atau [] + titik dua + teks
const LINE_RE = /^([^:：()\[\]]{1,40}?)\s*(?:[(\[]([^)\]]{0,120})[)\]])?\s*[:：]\s*(.*)$/;

export function parseDialog(script: string): ParsedDialog {
  const names: string[] = [];
  const normNames: string[] = [];
  const lines: DialogLine[] = [];
  const sourceLines: number[] = [];
  const errors: DialogError[] = [];

  const rawLines = script.split(/\r?\n/);
  rawLines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const m = LINE_RE.exec(trimmed);
    if (!m) {
      if (lines.length === 0) {
        errors.push({ code: 'NO_NAME_FIRST_LINE', line: lineNo });
      } else {
        const prev = lines[lines.length - 1];
        prev.text = `${prev.text} ${trimmed}`.trim();
      }
      return;
    }

    const name = m[1].trim();
    const expression = (m[2] || '').trim();
    const text = (m[3] || '').trim();

    if (name.length > MAX_NAME_CHARS) {
      errors.push({ code: 'NAME_TOO_LONG', line: lineNo, detail: name });
      return;
    }

    const norm = normalizeName(name);
    let speaker = normNames.indexOf(norm);
    if (speaker === -1) {
      if (names.length >= MAX_DIALOG_SPEAKERS) {
        errors.push({ code: 'TOO_MANY_SPEAKERS', line: lineNo, detail: name });
        return;
      }
      names.push(name);
      normNames.push(norm);
      speaker = names.length - 1;
    }

    if (!text) return; // baris nama tanpa isi diabaikan
    sourceLines.push(idx);
    lines.push({
      speaker,
      text,
      ...(expression ? { expression: expression.slice(0, MAX_EXPRESSION_CHARS) } : {}),
    });
  });

  const totalChars = lines.reduce((n, l) => n + l.text.length, 0);

  if (lines.length === 0 && errors.length === 0) errors.push({ code: 'EMPTY' });
  if (lines.length > 0 && names.length < 2) errors.push({ code: 'ONE_SPEAKER' });
  if (lines.length > MAX_DIALOG_LINES) errors.push({ code: 'TOO_MANY_LINES', detail: String(lines.length) });
  if (totalChars > MAX_DIALOG_CHARS) errors.push({ code: 'TOO_LONG', detail: String(totalChars) });

  return { names, lines, sourceLines, errors, totalChars };
}

/* ------------------------------------------------------------------ */
/* Ekspresi per baris (untuk tombol ekspresi di tampilan)               */
/* ------------------------------------------------------------------ */

export interface ExpressionPreset {
  /** Istilah Arab yang dimasukkan ke naskah */
  ar: string;
  id: string;
  en: string;
  emoji: string;
  /** Arahan singkat berbahasa Inggris yang dikirim ke Gemini untuk baris ini */
  style: string;
  /** Tanda khusus Gemini yang disisipkan di awal baris (opsional) */
  tag?: string;
}

export const EXPRESSION_PRESETS: ExpressionPreset[] = [
  { ar: 'بفرح', id: 'Gembira', en: 'Happy', emoji: '😊', style: 'happy and joyful, smiling while speaking' },
  { ar: 'بحماس', id: 'Semangat', en: 'Excited', emoji: '🔥', style: 'excited and energetic' },
  { ar: 'بتعجب', id: 'Heran', en: 'Surprised', emoji: '😮', style: 'surprised and amazed' },
  { ar: 'مستفهمًا', id: 'Bertanya', en: 'Asking', emoji: '❓', style: 'asking a question, curious, rising intonation' },
  { ar: 'بتردد', id: 'Ragu', en: 'Hesitant', emoji: '🤔', style: 'hesitant and unsure, slightly halting' },
  { ar: 'بهدوء', id: 'Tenang', en: 'Calm', emoji: '😌', style: 'calm and relaxed, soft and steady' },
  { ar: 'بلطف', id: 'Lembut', en: 'Gentle', emoji: '🤗', style: 'gentle and kind, warm and soft' },
  { ar: 'بحزن', id: 'Sedih', en: 'Sad', emoji: '😢', style: 'sad and sorrowful, subdued' },
  { ar: 'بقلق', id: 'Cemas', en: 'Worried', emoji: '😟', style: 'worried and anxious' },
  { ar: 'بخوف', id: 'Takut', en: 'Afraid', emoji: '😨', style: 'scared and fearful, voice trembling slightly' },
  { ar: 'بغضب', id: 'Marah', en: 'Angry', emoji: '😠', style: 'angry and irritated, firm and sharp' },
  { ar: 'معتذرًا', id: 'Minta maaf', en: 'Apologetic', emoji: '🙏', style: 'apologetic and sincere, soft' },
  { ar: 'بفخر', id: 'Bangga', en: 'Proud', emoji: '😎', style: 'proud and confident' },
  { ar: 'ضاحكًا', id: 'Tertawa', en: 'Laughing', emoji: '😄', style: 'laughing while speaking, amused', tag: '<laugh>' },
  {
    ar: 'هامسًا',
    id: 'Berbisik',
    en: 'Whispering',
    emoji: '🤫',
    style: 'whispering very softly and quietly, hushed and breathy for the whole line',
    tag: '<whispering>',
  },
  { ar: 'بصوت عالٍ', id: 'Lantang', en: 'Loud', emoji: '📢', style: 'loud and projecting, almost shouting' },
];

/**
 * Terjemahkan ekspresi baris menjadi arahan untuk Gemini.
 * Ekspresi dari tombol (Arab, atau namanya dalam Indonesia/Inggris) memakai arahan yang sudah disiapkan;
 * ekspresi bebas dikirim apa adanya.
 */
export function expressionToStyle(expression: string): { style: string; tag?: string } {
  const raw = expression.trim();
  const key = normalizeName(raw);
  const preset = EXPRESSION_PRESETS.find(
    (p) => normalizeName(p.ar) === key || p.id.toLowerCase() === key || p.en.toLowerCase() === key
  );
  if (preset) return { style: preset.style, ...(preset.tag ? { tag: preset.tag } : {}) };
  return { style: raw };
}

/** Nomor baris (mulai 0) tempat posisi kursor berada. */
export function lineIndexAt(script: string, offset: number): number {
  let n = 0;
  const end = Math.min(Math.max(offset, 0), script.length);
  for (let i = 0; i < end; i++) if (script[i] === '\n') n++;
  return n;
}

/** Posisi karakter awal sebuah baris. */
export function lineStartOffset(script: string, lineIndex: number): number {
  let pos = 0;
  for (let i = 0; i < lineIndex; i++) {
    const next = script.indexOf('\n', pos);
    if (next === -1) return script.length;
    pos = next + 1;
  }
  return pos;
}

export interface LineInfo {
  /** baris naskah (mulai 0) yang memuat nama tokoh untuk giliran ini */
  ownerLine: number;
  name: string;
  expression: string;
  text: string;
}

/**
 * Cari giliran bicara di posisi baris tertentu.
 * Kalau baris itu lanjutan (tanpa "Nama:"), yang dipakai adalah baris bernama di atasnya.
 */
export function getLineInfo(script: string, lineIndex: number): LineInfo | null {
  const rows = script.split(/\r?\n/);
  for (let i = Math.min(lineIndex, rows.length - 1); i >= 0; i--) {
    const trimmed = rows[i].trim();
    if (!trimmed) {
      if (i === lineIndex) continue; // kursor di baris kosong: lihat ke atas
      continue;
    }
    const m = LINE_RE.exec(trimmed);
    if (m) {
      return { ownerLine: i, name: m[1].trim(), expression: (m[2] || '').trim(), text: (m[3] || '').trim() };
    }
  }
  return null;
}

/** Bersihkan ekspresi ketikan pengguna agar tidak merusak format naskah. */
export function sanitizeExpression(expr: string): string {
  return expr.replace(/[()[\]:：\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_EXPRESSION_CHARS);
}

/**
 * Pasang/ganti/hapus ekspresi pada giliran di baris tertentu.
 * expression kosong = hapus ekspresi. Mengembalikan naskah baru dan baris yang diubah.
 */
export function setLineExpression(
  script: string,
  lineIndex: number,
  expression: string
): { script: string; ownerLine: number } | null {
  const info = getLineInfo(script, lineIndex);
  if (!info) return null;
  const rows = script.split(/\r?\n/);
  const expr = sanitizeExpression(expression);
  rows[info.ownerLine] = expr ? `${info.name} (${expr}): ${info.text}` : `${info.name}: ${info.text}`;
  return { script: rows.join('\n'), ownerLine: info.ownerLine };
}

/** Susun kembali naskah dari baris-baris (untuk disimpan di riwayat). */
export function formatDialog(names: string[], lines: DialogLine[]): string {
  return lines
    .map((l) => {
      const name = names[l.speaker] || `Tokoh ${l.speaker + 1}`;
      return l.expression ? `${name} (${l.expression}): ${l.text}` : `${name}: ${l.text}`;
    })
    .join('\n');
}

/** Contoh naskah dialog siap pakai. */
export const DIALOG_SAMPLES: { id: string; labelId: string; labelEn: string; labelAr: string; voices: [string, string]; script: string }[] = [
  {
    id: 'santri',
    labelId: 'Dua Santri',
    labelEn: 'Two Students',
    labelAr: 'طالبان',
    voices: ['Puck', 'Charon'],
    script: [
      'أحمد: السَّلَامُ عَلَيْكُمْ يَا عُمَرُ، كَيْفَ حَالُكَ؟',
      'عمر (بفرح): وَعَلَيْكُمُ السَّلَامُ يَا أَحْمَدُ، أَنَا بِخَيْرٍ وَالْحَمْدُ لِلَّهِ. وَأَنْتَ؟',
      'أحمد: أَنَا أَيْضًا بِخَيْرٍ. إِلَى أَيْنَ تَذْهَبُ الْآنَ؟',
      'عمر: أَذْهَبُ إِلَى الْمَكْتَبَةِ لِأَسْتَعِيرَ كِتَابًا.',
      'أحمد (متعجبًا): مَا شَاءَ اللَّهُ! أَيَّ كِتَابٍ تُرِيدُ؟',
      'عمر: كِتَابَ قِصَصِ الْأَنْبِيَاءِ. هَلْ تَذْهَبُ مَعِي؟',
      'أحمد: نَعَمْ، هَيَّا بِنَا!',
    ].join('\n'),
  },
  {
    id: 'santriwati',
    labelId: 'Dua Santriwati',
    labelEn: 'Two Girls',
    labelAr: 'طالبتان',
    voices: ['Kore', 'Zephyr'],
    script: [
      'مريم: صَبَاحَ الْخَيْرِ يَا عَائِشَةُ.',
      'عائشة: صَبَاحَ النُّورِ يَا مَرْيَمُ. هَلْ حَفِظْتِ الدَّرْسَ؟',
      'مريم (بقلق): لَيْسَ كُلَّهُ، الْمُفْرَدَاتُ الْجَدِيدَةُ صَعْبَةٌ قَلِيلًا.',
      'عائشة (بلطف): لَا بَأْسَ، هَيَّا نُرَاجِعُهَا مَعًا بَعْدَ الصَّلَاةِ.',
      'مريم: جَزَاكِ اللَّهُ خَيْرًا يَا عَائِشَةُ!',
      'عائشة: وَإِيَّاكِ.',
    ].join('\n'),
  },
];
