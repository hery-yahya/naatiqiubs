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

  return { names, lines, errors, totalChars };
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
