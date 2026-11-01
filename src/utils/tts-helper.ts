export type TTSStyleId = 'netral' | 'gembira' | 'formal_berita';

/**
 * Tempo bicara yang dibuat langsung oleh Gemini (bukan sekadar mempercepat/memperlambat pemutaran).
 * - normal : tempo biasa
 * - lambat : bicara pelan dan jelas
 * - eja    : sangat pelan, berhenti sejenak setelah setiap kata (untuk latihan menyimak)
 */
export type TempoId = 'normal' | 'lambat' | 'eja';

export const TEMPO_IDS: TempoId[] = ['normal', 'lambat', 'eja'];

/**
 * Arahan tempo untuk Gemini. Sengaja singkat dan berbahasa Inggris, sesuai saran
 * dokumentasi Gemini TTS (arahan panjang justru membuat suara melenceng).
 */
export const TEMPO_DIRECTIVES: Record<TempoId, string> = {
  normal: '',
  lambat: 'speaking slowly and clearly',
  eja: 'speaking very slowly, word by word',
};

export function isTempoId(value: unknown): value is TempoId {
  return typeof value === 'string' && (TEMPO_IDS as string[]).includes(value);
}

/**
 * Untuk tempo "eja": sisipkan tanda jeda Gemini di antara kata.
 * Setelah akhir kalimat (. ! ? ؟ ؛) dipakai jeda panjang, setelah koma (، ,) jeda sedang-panjang,
 * selain itu jeda pendek.
 */
export function applyTempoToText(text: string, tempo: TempoId): string {
  if (tempo !== 'eja') return text;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return text.trim();
  return words
    .map((word, i) => {
      if (i === words.length - 1) return word;
      if (/[.!?؟؛:]$/.test(word)) return `${word} <long pause>`;
      return `${word} <short pause>`;
    })
    .join(' ');
}

export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const AI_TEXT_MODEL = 'gemini-3.8-flash';

export interface TTSStyleConfig {
  id: TTSStyleId;
  name: string;
  nameArabic: string;
  badge: string;
  description: string;
  /** Penjelasan gaya dalam bahasa Arab (dipakai untuk Asisten AI penulis naskah) */
  directive: string;
  /** Arahan singkat berbahasa Inggris yang dikirim ke Gemini TTS */
  ttsStyle: string;
  sampleText: string;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  activeRing: string;
}

export interface VoiceOption {
  /** Nama suara bawaan Gemini (dikirim ke Gemini, jangan diubah) */
  id: string;
  /** Nama yang tampil di aplikasi (nama Arab agar familiar bagi murid) */
  name: string;
  nameArabic: string;
  gender: 'أنثى (Wanita)' | 'ذكر (Pria)';
  character: string;
  characterArabic: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Maryam',
    nameArabic: 'مريم',
    gender: 'أنثى (Wanita)',
    character: 'Hangat, jernih, dan artikulasi Arab fusha sangat jelas',
    characterArabic: 'صوت أنثوي دافئ، فصيح ومخارج حروف واضحة',
  },
  {
    id: 'Fenrir',
    name: 'Zaid',
    nameArabic: 'زيد',
    gender: 'ذكر (Pria)',
    character: 'Wibawa, bass dalam, sangat cocok untuk berita formal',
    characterArabic: 'صوت رخيم جهوري ووقور، مثالي للنشرات الإخبارية',
  },
  {
    id: 'Puck',
    name: 'Musa',
    nameArabic: 'موسى',
    gender: 'ذكر (Pria)',
    character: 'Ceria, bersahabat, energik dan ekspresif',
    characterArabic: 'صوت شبابي مفعم بالحيوية والبهجة والحماس',
  },
  {
    id: 'Zephyr',
    name: 'Zainab',
    nameArabic: 'زينب',
    gender: 'أنثى (Wanita)',
    character: 'Cerah, modern, elegan dan artikulatif',
    characterArabic: 'صوت أنثوي مشرق وعصري وأنيق مخارج الحروف',
  },
  {
    id: 'Charon',
    name: 'Yasir',
    nameArabic: 'ياسر',
    gender: 'ذكر (Pria)',
    character: 'Tenang, mendalam, cocok untuk narasi dan hikmah',
    characterArabic: 'صوت رصين وتأملي هادئ ومريح للمستمع',
  },
];

/** Nama tampilan suara (mis. "Fenrir" → "Zaid"). Riwayat lama yang menyimpan nama Gemini tetap tampil dengan nama baru. */
export function voiceDisplayName(voiceId: string): string {
  return AVAILABLE_VOICES.find((v) => v.id === voiceId)?.name || voiceId;
}

export const STYLE_CONFIGS: Record<TTSStyleId, TTSStyleConfig> = {
  netral: {
    id: 'netral',
    name: 'Netral (محايد)',
    nameArabic: 'محايد وطبيعي',
    badge: 'طبيعي وهادئ',
    description: 'إلقاء هادئ ومتزن باللغة العربية الفصحى، مناسب للمحادثات، البودكاست الثقافي، والكتب المسموعة.',
    directive: 'تحدث باللغة العربية الفصحى السليمة بنبرة محايدة، هادئة، متزنة، ومخارج حروف واضحة ونطق عربي فصيح وطبيعي.',
    ttsStyle: 'calm, clear and natural',
    sampleText: 'أَهْلًا وَسَهْلًا بِكُمْ فِي تَطْبِيقِ نَاطِقٍ لِتَحْوِيلِ النَّصِّ إِلَى صَوْتٍ فَصِيحٍ، حَيْثُ نَسْعَى لِتَقْدِيمِ تَجْرِبَةٍ صَوْتِيَّةٍ عَرَبِيَّةٍ رَائِعَةٍ.',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    borderColor: 'border-emerald-500/30',
    activeRing: 'ring-2 ring-emerald-500 bg-emerald-500/10',
  },
  gembira: {
    id: 'gembira',
    name: 'Gembira (مبتهج)',
    nameArabic: 'مبتهج وحماسي',
    badge: 'فرح وحماسي',
    description: 'نبرة مفعمة بالفرح والسرور والحماس والابتسامة، مثالية للتهاني، الإعلانات التشويقية، والقصص الحيوية.',
    directive: 'تحدث باللغة العربية الفصحى بنبرة مبهجة للغاية، مشرقة، مفعمة بالفرح والسرور والحماس والطاقة الإيجابية مع ابتسامة واضحة في نبرة الصوت!',
    ttsStyle: 'cheerful and enthusiastic, smiling',
    sampleText: 'مَرْحَبًا بِكُمْ جَمِيعًا! يُسْعِدُنَا جِدًّا أَنْ نُعْلِنَ لَكُمُ الْيَوْمَ عَنْ هَذَا الْإِنْجَازِ الرَّائِعِ، أَلْفُ مَبْرُوكٍ لِلْجَمِيعِ وَدَامَتْ أَيَّامُكُمْ أَفْرَاحًا!',
    accentColor: 'text-amber-400',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    borderColor: 'border-amber-500/30',
    activeRing: 'ring-2 ring-amber-500 bg-amber-500/10',
  },
  formal_berita: {
    id: 'formal_berita',
    name: 'Formal Berita (إخباري)',
    nameArabic: 'إخباري رسمي',
    badge: 'وقور وفصيح',
    description: 'نبرة مذيع نشرات الأخبار التلفزيونية الرسمية، إلقاء جهوري وقور، إيقاع رصين ودقة تامة في الضبط والتشكيل.',
    directive: 'تحدث باللغة العربية الفصحى بنبرة مذيع نشرة أخبار تلفزيونية رسمية، وقورة، رصينة، ذات إلقاء جهوري متقن ومخارج حروف عربية دقيقة ونبرة إخبارية موثوقة.',
    ttsStyle: 'formal news anchor, authoritative and measured',
    sampleText: 'سَيِّدَاتِي وَسَادَتِي، طَابَتْ أَوْقَاتُكُمْ. إِلَيْكُمُ النَّشْرَةَ الْإِخْبَارِيَّةَ الْمُفَصَّلَةَ، حَيْثُ أَعْلَنَتِ الْجِهَاتُ الْمَعْنِيَّةُ الْيَوْمَ عَنْ حُزْمَةٍ جَدِيدَةٍ مِنَ الْمَشَارِيعِ التَّنْمَوِيَّةِ.',
    accentColor: 'text-indigo-400',
    bgGradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
    borderColor: 'border-indigo-500/30',
    activeRing: 'ring-2 ring-indigo-500 bg-indigo-500/10',
  },
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  charCount: number;
  wordCount: number;
}

export function validateTtsInput(text: string, maxChars = 2000): ValidationResult {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  if (charCount === 0) {
    return { isValid: false, error: 'النص فارغ، يرجى كتابة نص باللغة العربية الفصحى.', charCount: 0, wordCount: 0 };
  }

  if (charCount > maxChars) {
    return {
      isValid: false,
      error: `تجاوز النص الحد الأقصى المسموح (${maxChars} حرفاً). الحالي: ${charCount} حرفاً.`,
      charCount,
      wordCount,
    };
  }

  return { isValid: true, charCount, wordCount };
}

/**
 * Susun arahan gaya untuk Gemini: gaya (atau ekspresi baris) + tempo + ekspresi tambahan.
 * - expressionStyle: kalau diisi (ekspresi per baris dialog), MENGGANTIKAN gaya umum
 *   agar tidak bertabrakan, misalnya gaya "ceria" dengan ekspresi "berbisik".
 */
export function buildSpeechDirective(
  styleId: TTSStyleId,
  customStylePrompt?: string,
  tempo: TempoId = 'normal',
  expressionStyle?: string
): string {
  const parts: string[] = [];
  const expr = (expressionStyle || '').trim();
  parts.push(expr || STYLE_CONFIGS[styleId]?.ttsStyle || STYLE_CONFIGS.netral.ttsStyle);
  const tempoDirective = TEMPO_DIRECTIVES[tempo] || '';
  if (tempoDirective) parts.push(tempoDirective);
  const custom = (customStylePrompt || '').trim();
  if (custom) parts.push(custom);
  return parts.join('; ');
}

export function estimateSpeechDurationSeconds(text: string, speedMultiplier = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  // Arabic Fusha average speaking rate: ~110-120 words per minute
  const baseSeconds = (words / 115) * 60;
  return Math.max(1, Math.round((baseSeconds / speedMultiplier) * 10) / 10);
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function isArabicText(text: string): boolean {
  // Check if string contains Arabic Unicode range (\u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF)
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}
